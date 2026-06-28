import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export function setErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id;
    const timestamp = new Date().toISOString();

    if (error instanceof ZodError) {
      reply.status(422).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors,
        },
        meta: { requestId, timestamp },
      });
      return;
    }

    if (error.code === 'FST_ERR_VALIDATION') {
      reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.message,
        },
        meta: { requestId, timestamp },
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        reply.status(409).send({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Unique constraint failed',
            details: { target: error.meta?.target },
          },
          meta: { requestId, timestamp },
        });
        return;
      }
      if (error.code === 'P2025') {
        reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Record not found',
          },
          meta: { requestId, timestamp },
        });
        return;
      }
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
        meta: { requestId, timestamp },
      });
      return;
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
       reply.status(error.statusCode).send({
          success: false,
          error: {
             code: error.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
             message: error.message,
          },
          meta: { requestId, timestamp }
       });
       return;
    }

    logger.error({ err: error, requestId }, 'Unhandled error');

    const isProd = process.env.NODE_ENV === 'production';
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: isProd ? undefined : error.message,
      },
      meta: { requestId, timestamp },
    });
  });
}
