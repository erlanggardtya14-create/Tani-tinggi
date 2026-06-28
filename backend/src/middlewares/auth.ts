import { FastifyRequest, FastifyReply } from 'fastify';
import type { JwtPayload } from '../types';

/**
 * Middleware to require a valid JWT token in the Authorization header.
 * Populates request.currentUser with decoded payload.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Fastify JWT plugin verifies and decodes the token
    const decoded = await request.jwtVerify<JwtPayload>();
    request.currentUser = decoded;
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
}

/**
 * Middleware factory to restrict access to specific roles.
 * Must be used after requireAuth.
 */
export function requireRole(...roles: Array<'FARMER' | 'BUYER' | 'ADMIN'>) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.currentUser;
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${roles.join(' or ')}`,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  };
}
