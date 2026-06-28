import { PrismaClient, FertilizerType, VehicleType } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Admin
  const adminPassword = await hashPassword('Admin1234!');
  await prisma.user.upsert({
    where: { email: 'admin@tanitinggi.id' },
    update: {},
    create: {
      email: 'admin@tanitinggi.id',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('✅ Admin user created');

  // 2. Create Farmers
  const farmerPassword = await hashPassword('Farmer1234!');
  
  const farmer1 = await prisma.user.upsert({
    where: { email: 'dieng@tanitinggi.id' },
    update: {},
    create: {
      email: 'dieng@tanitinggi.id',
      passwordHash: farmerPassword,
      role: 'FARMER',
      isVerified: true,
      farmer: {
        create: {
          fullName: 'Budi Santoso',
          farmName: 'Kebun Sayur Dieng',
          farmLocation: 'Dieng, Wonosobo, Jawa Tengah',
          latitude: -7.214,
          longitude: 109.914,
          altitude: 2000,
        }
      }
    },
    include: { farmer: true }
  });

  const farmer2 = await prisma.user.upsert({
    where: { email: 'bromo@tanitinggi.id' },
    update: {},
    create: {
      email: 'bromo@tanitinggi.id',
      passwordHash: farmerPassword,
      role: 'FARMER',
      isVerified: true,
      farmer: {
         create: {
            fullName: 'Agus Setiawan',
            farmName: 'Ladang Hijau Bromo',
            farmLocation: 'Sukapura, Probolinggo, Jawa Timur',
            latitude: -7.930,
            longitude: 112.953,
            altitude: 2329,
         }
      }
    },
    include: { farmer: true }
  });

  console.log('✅ Farmer profiles created');

  if (!farmer1.farmer || !farmer2.farmer) {
     throw new Error('Failed to create farmers');
  }

  // 3. Create Farm Records
  const record1 = await prisma.farmRecord.create({
     data: {
        farmerId: farmer1.farmer.id,
        localId: crypto.randomUUID(),
        vegetableType: 'Kentang',
        vegetableWeight: 500, // 500kg
        fertilizerType: FertilizerType.ORGANIC_COMPOST,
        pesticidesUsed: false,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', // Mock URL
        imageHash: crypto.randomUUID(), // Mock hash
        capturedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'CERTIFIED',
        deliveryInfo: {
           create: {
              distanceKm: 120, // Dieng to Semarang
              vehicleType: VehicleType.PICKUP_TRUCK,
              destinationCity: 'Semarang'
           }
        },
        aiValidation: {
           create: {
              isValidPlant: true,
              detectedClass: 'Kentang',
              confidence: 0.95,
              modelVersion: '1.0.0',
              processingMs: 340
           }
        },
        carbonScore: {
           create: {
              rawCarbonKg: 120 * 500 * 0.000097,
              fertilizerPenalty: 0,
              totalCarbonKg: 120 * 500 * 0.000097, // ~5.8 kg CO2e -> Grade C
              ecoGrade: 'C',
              ecoScore: 76,
              calculationVersion: '1.0.0'
           }
        },
        certificate: {
           create: {
              tokenId: '1',
              txHash: '0xmocktxhash1234567890abcdef1',
              contractAddress: '0xmockcontractaddress',
              status: 'MINTED',
              issuedAt: new Date()
           }
        }
     }
  });

  const record2 = await prisma.farmRecord.create({
     data: {
        farmerId: farmer2.farmer.id,
        localId: crypto.randomUUID(),
        vegetableType: 'Sawi',
        vegetableWeight: 50, // 50kg
        fertilizerType: FertilizerType.CHEMICAL_UREA,
        pesticidesUsed: true,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        imageHash: crypto.randomUUID(),
        capturedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'FAILED',
        deliveryInfo: {
           create: {
              distanceKm: 80, // Bromo to Malang
              vehicleType: VehicleType.MOTORCYCLE,
              destinationCity: 'Malang'
           }
        },
        aiValidation: {
           create: {
              isValidPlant: true,
              detectedClass: 'Sawi',
              confidence: 0.88,
              modelVersion: '1.0.0',
              processingMs: 310
           }
        },
        carbonScore: {
           create: {
              rawCarbonKg: 80 * 50 * 0.000103, // ~0.41 kg CO2e
              fertilizerPenalty: 0.8,
              totalCarbonKg: 0.41 + 0.8 + 0.3, // ~1.51 kg CO2e -> Grade A (Wait, total is small due to weight, but has penalties)
              ecoGrade: 'D', // Hardcode Grade D for example of failed certification due to policy
              ecoScore: 35,
              calculationVersion: '1.0.0'
           }
        }
     }
  });

  const record3 = await prisma.farmRecord.create({
     data: {
        farmerId: farmer1.farmer.id,
        localId: crypto.randomUUID(),
        vegetableType: 'Wortel',
        vegetableWeight: 200, // 200kg
        fertilizerType: FertilizerType.ORGANIC_MANURE,
        pesticidesUsed: false,
        capturedAt: new Date(),
        status: 'PENDING',
        deliveryInfo: {
           create: {
              distanceKm: 60, // Dieng to Magelang
              vehicleType: VehicleType.PICKUP_TRUCK,
              destinationCity: 'Magelang'
           }
        }
     }
  });

  console.log('✅ Farm records created (CERTIFIED, FAILED, PENDING)');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
