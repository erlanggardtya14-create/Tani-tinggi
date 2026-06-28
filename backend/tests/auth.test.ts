import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { prisma } from '../src/config/database';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  // Clean DB before testing auth
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await app.close();
});

describe('Auth Module', () => {
  it('should register a new farmer', async () => {
    const res = await request(app.server)
      .post('/api/v1/auth/register')
      .send({
        email: 'testfarmer@example.com',
        password: 'Password123!',
        role: 'FARMER',
        fullName: 'Test Farmer',
        farmName: 'Test Farm',
        farmLocation: 'Test Location',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBeDefined();
  });

  it('should not allow duplicate email registration', async () => {
    const res = await request(app.server)
      .post('/api/v1/auth/register')
      .send({
        email: 'testfarmer@example.com',
        password: 'Password123!',
        role: 'FARMER',
        fullName: 'Test Farmer 2',
        farmName: 'Test Farm 2',
        farmLocation: 'Test Location 2',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should login successfully and return tokens', async () => {
    const res = await request(app.server)
      .post('/api/v1/auth/login')
      .send({
        email: 'testfarmer@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app.server)
      .post('/api/v1/auth/login')
      .send({
        email: 'testfarmer@example.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fail accessing protected route without token', async () => {
    const res = await request(app.server).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
