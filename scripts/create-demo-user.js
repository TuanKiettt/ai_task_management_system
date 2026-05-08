const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    const demoUser = await prisma.user.upsert({
      where: { id: 'demo-user-123' },
      update: {},
      create: {
        id: 'demo-user-123',
        email: 'demo@example.com',
        password: 'demo-password', // In production, this should be hashed
        fullName: 'Demo User',
        industry: 'education',
        isActive: true
      }
    });
    
    console.log('Demo user created/updated:', demoUser);
  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
