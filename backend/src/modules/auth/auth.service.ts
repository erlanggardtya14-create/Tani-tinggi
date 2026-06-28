import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { prisma } from '../../config/database';
import { env, loadJwtKeys } from '../../config/env';
import { JwtPayload, JwtTokenPair } from '../../types';
import { RegisterInput, LoginInput } from './auth.schema';

const keys = loadJwtKeys();

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
    });
  });
}

function generateTokenPair(payload: JwtPayload): JwtTokenPair {
  let accessToken: string;
  let refreshToken: string;

  if (keys) {
    accessToken = jwt.sign(payload, keys.privateKey, { algorithm: 'RS256', expiresIn: env.JWT_EXPIRES_IN });
    refreshToken = jwt.sign({ sub: payload.sub, type: 'refresh' }, keys.privateKey, { algorithm: 'RS256', expiresIn: env.JWT_REFRESH_EXPIRES_IN });
  } else {
    accessToken = jwt.sign(payload, 'tanitinggi-dev-secret', { expiresIn: env.JWT_EXPIRES_IN });
    refreshToken = jwt.sign({ sub: payload.sub, type: 'refresh' }, 'tanitinggi-dev-secret', { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
  }

  return { accessToken, refreshToken };
}

export class AuthService {
  async register(data: RegisterInput) {
    if (data.role === 'FARMER' && (!data.fullName || !data.farmName || !data.farmLocation)) {
      throw Object.assign(new Error('Farmer details required'), { statusCode: 422 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
    }

    const passwordHash = await hashPassword(data.password);
    const verifyToken = crypto.randomUUID();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role,
        },
      });

      if (data.role === 'FARMER') {
        await tx.farmer.create({
          data: {
            userId: user.id,
            fullName: data.fullName!,
            farmName: data.farmName!,
            farmLocation: data.farmLocation!,
          },
        });
      }

      await tx.session.create({
        data: {
          userId: user.id,
          token: verifyToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        },
      });

      return user;
    });

    return { userId: result.id, message: 'Registration successful', verifyToken };
  }

  async login(data: LoginInput): Promise<JwtTokenPair> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    let farmerId: string | undefined = undefined;
    if (user.role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({ where: { userId: user.id } });
      if (farmer) farmerId = farmer.id;
    }

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role as any, farmerId };
    const tokens = generateTokenPair(payload);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return tokens;
  }

  async refreshToken(token: string): Promise<JwtTokenPair> {
    const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
    if (!session || session.expiresAt < new Date()) {
      throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
    }

    let farmerId: string | undefined = undefined;
    if (session.user.role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({ where: { userId: session.user.id } });
      if (farmer) farmerId = farmer.id;
    }

    const payload: JwtPayload = { sub: session.user.id, email: session.user.email, role: session.user.role as any, farmerId };
    const tokens = generateTokenPair(payload);

    await prisma.session.update({
      where: { id: session.id },
      data: { token: tokens.refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });

    return tokens;
  }

  async logout(token: string) {
    await prisma.session.deleteMany({ where: { token } });
  }

  async getMe(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        farmer: true,
      },
    });
  }

  async verifyEmail(token: string) {
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      throw Object.assign(new Error('Invalid or expired token'), { statusCode: 400 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { isVerified: true },
    });

    await prisma.session.delete({ where: { id: session.id } });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent success for security

    const resetToken = crypto.randomUUID();
    await prisma.session.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      },
    });
    // Normally you'd send an email here
    return resetToken;
  }

  async resetPassword(token: string, newPassword: string) {
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      throw Object.assign(new Error('Invalid or expired token'), { statusCode: 400 });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash },
    });

    await prisma.session.delete({ where: { id: session.id } });
  }
}
