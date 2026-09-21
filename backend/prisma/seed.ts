/**
 * @school-van-tracker/seed - Database seed script
 * 
 * Creates sample data for development/testing:
 * - 1 School
 * - 1 Admin user
 * - 2 Drivers
 * - 3 Parents
 * - 5 Students
 * - 2 Vans
 * - Routes, trips, and pickup logs
 */

import { PrismaClient } from '../src/generated/prisma';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Configuration
  const schoolId = '11111111-1111-1111-1111-111111111111';
  const adminPassword = await argon2.hash('Admin123!');
  const driverPassword = await argon2.hash('Driver123!');
  const parentPassword = await argon2.hash('Parent123!');

  // 1. Create School
  console.log('📚 Creating school...');
  const school = await prisma.school.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: schoolId,
      name: 'Sunrise Elementary School',
      code: 'SES',
      address: '123 Sunshine Ave, Happy Valley, CA 90210',
      phone: '+15551234567',
      email: 'admin@sunrise.edu',
      timezone: 'America/Los_Angeles',
      isActive: true,
    },
  });
  console.log(`   Created school: ${school.name} (${school.code})`);

  // 2. Create Admin User
  console.log('👨‍💼 Creating admin user...');
  const admin = await prisma.user.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222221',
      schoolId: school.id,
      email: 'admin@sunrise.edu',
      passwordHash: adminPassword,
      firstName: 'Sarah',
      lastName: 'Adminson',
      phone: '+15551112222',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`   Created admin: ${admin.email} (${admin.firstName} ${admin.lastName})`);

  // 3. Create Drivers
  console.log('🚐 Creating drivers...');
  const driver1 = await prisma.user.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333331',
      schoolId: school.id,
      email: 'driver1@sunrise.edu',
      passwordHash: driverPassword,
      firstName: 'Mike',
      lastName: 'Rodriguez',
      phone: '+15552223333',
      role: 'DRIVER',
      isActive: true,
    },
  });
  console.log(`   Created driver: ${driver1.email} (${driver1.firstName} ${driver1.lastName})`);

  const driver2 = await prisma.user.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333331',
      schoolId: school.id,
      email: 'driver2@sunrise.edu',
      passwordHash: driverPassword,
      firstName: 'Lisa',
      lastName: 'Chen',
      phone: '+15553334444',
      role: 'DRIVER',
      isActive: true,
    },
  });
  console.log(`   Created driver: ${driver2.email} (${driver2.firstName} ${driver2.lastName})`);

  // 4. Create Vans
  console.log('🚌 Creating vans...');
  const van1 = await prisma.van.upsert({
    where: { id: '66666666-6666-6666-6666-666666666666' },
    update: {},
    create: {
      id: '66666666-6666-6666-6666-666666666661',
      schoolId: school.id,
      name: 'Sunrise Van 1 - North Route',
      plateNumber: 'SUN-001',
      capacity: 15,
      make: 'Ford',
      model: 'Transit',
      year: 2022,
      color: 'Yellow',
      driverId: driver1.id,
      isActive: true,
    },
  });
  console.log(`   Created van: ${van1.name} (Plate: ${van1.plateNumber})`);

  const van2 = await prisma.van.upsert({
    where: { id: '66666666-6666-6666-6666-666666666666' },
    update: {},
    create: {
      id: '66666666-6666-6666-6666-666666666661',
      schoolId: school.id,
      name: 'Sunrise Van 2 - South Route',
      plateNumber: 'SUN-002',
      capacity: 12,
      make: 'Chevrolet',
      model: 'Express',
      year: 2021,
      color: 'Blue',
      driverId: driver2.id,
      isActive: true,
    },
  });
  console.log(`   Created van: ${van2.name} (Plate: ${van2.plateNumber})`);

  // 5. Create Parents
  console.log('👪 Creating parents...');
  const parent1 = await prisma.user.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: {},
    create: {
      id: '',
      schoolId: school.id,
      email: 'parent1@sunrise.edu',
      passwordHash: parentPassword,
      firstName: 'John',
      lastName: 'Smith',
      phone: '+15554445555',
      role: 'PARENT',
      isActive: true,
    },
  });
  console.log(`   Created parent: ${parent1.email} (${parent1.firstName} ${parent1.lastName})`);

  const parent2 = await prisma.user.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444441',
      schoolId: school.id,
      email: 'parent2@sunrise.edu',
      passwordHash: parentPassword,
      firstName: 'Emily',
      lastName: 'Johnson',
      phone: '+15555556666',
      role: 'PARENT',
      isActive: true,
    },
  });
  console.log(`   Created parent: ${parent2.email} (${parent2.firstName} ${parent2.lastName})`);

  const parent3 = await prisma.user.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444441',
      schoolId: school.id,
      email: 'parent3@sunrise.edu',
      passwordHash: parentPassword,
      firstName: 'David',
      lastName: 'Williams',
      phone: '+15556667777',
      role: 'PARENT',
      isActive: true,
    },
  });
  console.log(`   Created parent: ${parent3.email} (${parent3.firstName} ${parent3.lastName})`);

  // 6. Create Students
  console.log('🎒 Creating students...');
  
  const student1 = await prisma.student.upsert({
    where: { id: '55555555-5555-5555-5555-555555555551' },
    update: {},
    create: {
      id: '55555555-5555-5555-5555-555555555555',
      schoolId: school.id,
      firstName: 'Emma',
      lastName: 'Smith',
      dateOfBirth: new Date('2015-03-15'),
      gender: 'Female',
      parentId: parent1.id,
      vanId: van1.id,
      emergencyContactName: 'John Smith (Father)',
      emergencyContactPhone: '+15554445555',
      medicalInfo: 'Peanut allergy',
      isActive: true,
    },
  });
  console.log(`   Created student: ${student1.firstName} ${student1.lastName} (Van: ${van1.name})`);

  const student2 = await prisma.student.upsert({
    where: { id: '55555555-5555-5555-5555-555555555555' },
    update: {},
    create: {
      id: '55555555-5555-5555-5555-555555555551',
      schoolId: school.id,
      firstName: 'Liam',
      lastName: 'Johnson',
      dateOfBirth: new Date('2014-07-22'),
      gender: 'Male',
      parentId: parent2.id,
      vanId: van1.id,
      emergencyContactName: 'Emily Johnson (Mother)',
      emergencyContactPhone: '+15555556666',
      isActive: true,
    },
  });
  console.log(`   Created student: ${student2.firstName} ${student2.lastName} (Van: ${van1.name})`);

  const student3 = await prisma.student.upsert({
    where: { id: '55555555-5555-5555-5555-555555555555' },
    update: {},
    create: {
      id: '55555555-5555-5555-5555-555555555551',
      schoolId: school.id,
      firstName: 'Olivia',
      lastName: 'Williams',
      dateOfBirth: new Date('2016-01-10'),
      gender: 'Female',
      parentId: parent3.id,
      vanId: van2.id,
      emergencyContactName: 'David Williams (Father)',
      emergencyContactPhone: '+15556667777',
      medicalInfo: 'Asthma - inhaler in bag',
      isActive: true,
    },
  });
  console.log(`   Created student: ${student3.firstName} ${student3.lastName} (Van: ${van2.name})`);

  const student4 = await prisma.student.upsert({
    where: { id: '55555555-5555-5555-5555-555555555555' },
    update: {},
    create: {
      id: '55555555-5555-5555-5555-555555555551',
      schoolId: school.id,
      firstName: 'Noah',
      lastName: 'Brown',
      dateOfBirth: new Date('2015-11-30'),
      gender: 'Male',
      parentId: parent1.id,
      vanId: van2.id,
      emergencyContactName: 'John Smith (Father)',
      emergencyContactPhone: '+15554445555',
      isActive: true,
    },
  });
  console.log(`   Created student: ${student4.firstName} ${student4.lastName} (Van: ${van2.name})`);

  const student5 = await prisma.student.upsert({
    where: { id: '55555555-5555-5555-5555-555555555555' },
    update: {},
    create: {
      id: '55555555-5555-5555-5555-555555555551',
      schoolId: school.id,
      firstName: 'Ava',
      lastName: 'Davis',
      dateOfBirth: new Date('2016-05-18'),
      gender: 'Female',
      parentId: parent2.id,
      vanId: van1.id,
      emergencyContactName: 'Emily Johnson (Mother)',
      emergencyContactPhone: '+15555556666',
      isActive: true,
    },
  });
  console.log(`   Created student: ${student5.firstName} ${student5.lastName} (Van: ${van1.name})`);

  // 7. Create Route
  console.log('🗺️  Creating route...');
  const route = await prisma.route.upsert({
    where: { id: '77777777-7777-7777-7777-777777777771' },
    update: {},
    create: {
      id: '77777777-7777-7777-7777-777777777771',
      schoolId: school.id,
      name: 'North Side Morning Pickup',
      description: 'Morning pickup route for north side students',
      isActive: true,
    },
  });
  console.log(`   Created route: ${route.name}`);

  // Create route stops
  await prisma.routeStop.createMany({
    data: [
      {
        routeId: route.id,
        stopOrder: 1,
        name: 'Maple Street & Oak Avenue',
        latitude: 34.0522,
        longitude: -118.2437,
        address: '100 Maple St',
        estimatedArrival: 360, // 6:00 AM
      },
      {
        routeId: route.id,
        stopOrder: 2,
        name: 'Pine Street & Cedar Lane',
        latitude: 34.0532,
        longitude: -118.2447,
        address: '200 Pine St',
        estimatedArrival: 390, // 6:30 AM
      },
      {
        routeId: route.id,
        stopOrder: 3,
        name: 'School Main Entrance',
        latitude: 34.0542,
        longitude: -118.2457,
        address: '123 Sunshine Ave',
        estimatedArrival: 420, // 7:00 AM
      },
    ],
    skipDuplicates: true,
  });
  console.log('   Created 3 route stops');

  // Assign van to route
  await prisma.vanRoute.upsert({
    where: { vanId_routeId: { vanId: van1.id, routeId: route.id } },
    update: {},
    create: {
      vanId: van1.id,
      routeId: route.id,
      isPrimary: true,
    },
  });
  console.log(`   Assigned ${van1.name} to ${route.name}`);

  // 8. Create Sample Trip with Pickup Logs
  console.log('📍 Creating sample trip with pickup logs...');
  
  const trip = await prisma.trip.upsert({
    where: { id: 'trip-1-uuid-test' },
    update: {},
    create: {
      id: 'trip-1-uuid-test',
      schoolId: school.id,
      vanId: van1.id,
      routeId: route.id,
      driverId: driver1.id,
      tripType: 'PICKUP',
      status: 'COMPLETED',
      scheduledStart: new Date('2024-01-15T07:00:00'),
      actualStart: new Date('2024-01-15T07:05:00'),
      actualEnd: new Date('2024-01-15T07:45:00'),
      expectedDurationMinutes: 45,
      startLatitude: 34.0522,
      startLongitude: -118.2437,
      endLatitude: 34.0542,
      endLongitude: -118.2457,
      notes: 'Morning pickup - all students present',
    },
  });
  console.log(`   Created trip: ${trip.id}`);

  // Create pickup logs for each student on van1
  const van1Students = [student1, student2, student5];
  for (let i = 0; i < van1Students.length; i++) {
    const student = van1Students[i];
    await prisma.pickupLog.create({
      data: {
        schoolId: school.id,
        tripId: trip.id,
        studentId: student.id,
        action: 'PICKED_UP',
        actionTakenAt: new Date('2024-01-15T07:0' + (i + 1) + ':00'),
        latitude: 34.0522 + (i * 0.001),
        longitude: -118.2437 + (i * 0.001),
        verifiedBy: driver1.id,
        notes: `Picked up at stop ${i + 1}`,
      },
    });
    console.log(`   Created pickup log for ${student.firstName} ${student.lastName}`);
  }

  // 9. Create Sample Alerts
  console.log('⚠️  Creating sample alerts...');
  
  await prisma.alert.create({
    data: {
      schoolId: school.id,
      type: 'DELAY',
      severity: 'MEDIUM',
      vanId: van1.id,
      tripId: trip.id,
      title: 'Pickup Delayed',
      message: 'Van is running 5 minutes late due to traffic on Main Street',
      data: { delayMinutes: 5 },
      isRead: false,
    },
  });
  console.log('   Created delay alert');

  await prisma.alert.create({
    data: {
      schoolId: school.id,
      type: 'CUSTOM',
      severity: 'LOW',
      title: 'Weekend Reminder',
      message: 'No vans operating on weekends. Regular service resumes Monday.',
      isRead: true,
      readAt: new Date(),
    },
  });
  console.log('   Created custom alert (read)');

  // 10. Create Sample Messages
  console.log('💬 Creating sample messages...');
  
  await prisma.message.create({
    data: {
      schoolId: school.id,
      senderId: admin.id,
      receiverId: driver1.id,
      messageType: 'TEXT',
      content: 'Please arrive 10 minutes early tomorrow for the parent meeting.',
      isRead: false,
    },
  });
  console.log('   Created message from admin to driver1');

  await prisma.message.create({
    data: {
      schoolId: school.id,
      senderId: driver1.id,
      receiverId: admin.id,
      messageType: 'TEXT',
      content: 'Understood. I will be there at 7:00 AM.',
      isRead: true,
      readAt: new Date(),
    },
  });
  console.log('   Created reply from driver1 to admin');

  console.log('\n✅ Seeding completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Admin:    admin@sunrise.edu / Admin123!');
  console.log('   Driver 1: driver1@sunrise.edu / Driver123!');
  console.log('   Driver 2: driver2@sunrise.edu / Driver123!');
  console.log('   Parent 1: parent1@sunrise.edu / Parent123!');
  console.log('   Parent 2: parent2@sunrise.edu / Parent123!');
  console.log('   Parent 3: parent3@sunrise.edu / Parent123!');
  console.log('\n🔗 School ID: school-uuid-admin-test');
  console.log('🔗 Van 1 ID: van-1-uuid-test (Driver: Mike Rodriguez)');
  console.log('🔗 Van 2 ID: van-2-uuid-test (Driver: Lisa Chen)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
