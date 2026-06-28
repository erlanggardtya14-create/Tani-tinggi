import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { prisma } from '../src/config/database';
import * as crypto from 'crypto';

let app: FastifyInstance;
let token: string;
let deviceId: string;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  
  // Clean DB
  await prisma.user.deleteMany();
  
  // Create user and get token
  await request(app.server).post('/api/v1/auth/register').send({
     email: 'syncfarmer@example.com',
     password: 'Password123!',
     role: 'FARMER',
     fullName: 'Sync Farmer',
     farmName: 'Sync Farm',
     farmLocation: 'Sync Location',
  });

  const res = await request(app.server).post('/api/v1/auth/login').send({
     email: 'syncfarmer@example.com',
     password: 'Password123!',
  });
  
  token = res.body.data.accessToken;
  deviceId = crypto.randomUUID();
});

afterAll(async () => {
  await app.close();
});

describe('Sync Module', () => {
  const localId1 = crypto.randomUUID();
  const localId2 = crypto.randomUUID();

  it('should sync records and return 202', async () => {
    const res = await request(app.server)
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId,
        syncedAt: new Date().toISOString(),
        records: [
          {
            localId: localId1,
            vegetableType: 'Kentang',
            vegetableWeight: 100,
            fertilizerType: 'ORGANIC_COMPOST',
            pesticidesUsed: false,
            imageHash: 'mockhash1',
            capturedAt: new Date().toISOString(),
            delivery: {
              distanceKm: 50,
              vehicleType: 'PICKUP_TRUCK',
              destinationCity: 'Malang',
            }
          },
          {
            localId: localId2,
            vegetableType: 'Wortel',
            vegetableWeight: 50,
            fertilizerType: 'NONE',
            pesticidesUsed: false,
            imageHash: 'mockhash2',
            capturedAt: new Date().toISOString(),
            delivery: {
              distanceKm: 20,
              vehicleType: 'MOTORCYCLE',
              destinationCity: 'Batu',
            }
          }
        ]
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.success.length).toBe(2);
  });

  it('should skip duplicate records', async () => {
    const res = await request(app.server)
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId,
        syncedAt: new Date().toISOString(),
        records: [
          {
            localId: localId1, // Same localId
            vegetableType: 'Kentang',
            vegetableWeight: 100,
            fertilizerType: 'ORGANIC_COMPOST',
            pesticidesUsed: false,
            imageHash: 'mockhash1',
            capturedAt: new Date().toISOString(),
            delivery: {
              distanceKm: 50,
              vehicleType: 'PICKUP_TRUCK',
              destinationCity: 'Malang',
            }
          }
        ]
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.skipped.length).toBe(1);
    expect(res.body.data.success.length).toBe(0);
  });

  it('should fail sync with invalid fertilizer type', async () => {
    const res = await request(app.server)
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId,
        syncedAt: new Date().toISOString(),
        records: [
          {
            localId: crypto.randomUUID(),
            vegetableType: 'Kentang',
            vegetableWeight: 100,
            fertilizerType: 'INVALID_TYPE',
            pesticidesUsed: false,
            imageHash: 'mockhash1',
            capturedAt: new Date().toISOString(),
            delivery: {
              distanceKm: 50,
              vehicleType: 'PICKUP_TRUCK',
              destinationCity: 'Malang',
            }
          }
        ]
      });

    expect(res.status).toBe(422); // Zod validation failure
  });
});
