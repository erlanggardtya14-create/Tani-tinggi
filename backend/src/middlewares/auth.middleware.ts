import { FastifyRequest, FastifyReply } from 'fastify';
import * as jwt from 'jsonwebtoken';
import { loadJwtKeys } from '../config/env';
import { JwtPayload } from '../types';

const keys = loadJwtKeys();

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Object.assign(new Error('Missing or invalid Authorization header'), { statusCode: 401 });
  }

  const token = authHeader.substring(7);
  try {
    let payload: JwtPayload;
    if (keys) {
      payload = jwt.verify(token, keys.publicKey, { algorithms: ['RS256'] }) as JwtPayload;
    } else {
      payload = jwt.verify(token, 'tanitinggi-dev-secret') as JwtPayload;
    }
    request.currentUser = payload;
  } catch (error) {
    throw Object.assign(new Error('Invalid or expired token'), { statusCode: 401 });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await authenticate(request, reply);
    
    if (!request.currentUser || !roles.includes(request.currentUser.role)) {
      throw Object.assign(new Error('Forbidden: insufficient permissions'), { statusCode: 403 });
    }
  };
}
