const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo landlord users
  const landlordPassword = await bcrypt.hash('password123', 10);
  
  const landlord1 = await prisma.user.upsert({
    where: { email: 'landlord1@homie.et' },
    update: {},
    create: {
      email: 'landlord1@homie.et',
      password: landlordPassword,
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '+251911234567',
      role: 'LANDLORD',
      faydaVerified: true,
      kycStatus: 'VERIFIED',
      landlordVerified: true,
    },
  });

  const landlord2 = await prisma.user.upsert({
    where: { email: 'landlord2@homie.et' },
    update: {},
    create: {
      email: 'landlord2@homie.et',
      password: landlordPassword,
      firstName: 'Almaz',
      lastName: 'Tesfaye',
      phone: '+251922345678',
      role: 'LANDLORD',
      faydaVerified: true,
      kycStatus: 'VERIFIED',
      landlordVerified: true,
    },
  });

  const landlord3 = await prisma.user.upsert({
    where: { email: 'landlord3@homie.et' },
    update: {},
    create: {
      email: 'landlord3@homie.et',
      password: landlordPassword,
      firstName: 'Dawit',
      lastName: 'Haile',
      phone: '+251933456789',
      role: 'LANDLORD',
      faydaVerified: true,
      kycStatus: 'VERIFIED',
      landlordVerified: true,
    },
  });

  // Create demo tenant user
  const tenant1 = await prisma.user.upsert({
    where: { email: 'marta.solomon@gmail.com' },
    update: {
      email: 'marta.solomon@gmail.com',
      firstName: 'Marta',
      lastName: 'Solomon',
      phone: '+251944567890',
    },
    create: {
      email: 'marta.solomon@gmail.com',
      password: landlordPassword,
      firstName: 'Marta',
      lastName: 'Solomon',
      phone: '+251944567890',
      role: 'TENANT',
      faydaVerified: true,
      kycStatus: 'VERIFIED',
    },
  });

  console.log('✅ Created demo users');

  // Create demo properties
  const properties = [
    {
      title: 'Modern 2BR Apartment in Bole',
      description: 'Beautiful modern apartment located in the heart of Bole, close to Edna Mall and major business centers. Features spacious rooms, modern kitchen, and stunning city views.',
      address: 'Bole Road, Near Edna Mall',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      zipCode: '1000',
      country: 'Ethiopia',
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      bedrooms: 2,
      bathrooms: 1.5,
      area: 85,
      furnished: true,
      yearBuilt: 2020,
      parkingSpaces: 1,
      floorNumber: 5,
      totalFloors: 8,
      rentAmount: 18000,
      deposit: 36000,
      currency: 'ETB',
      status: 'AVAILABLE',
      available: true,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
      ],
      amenities: ['WiFi', 'Parking', 'Security', 'Elevator', 'Backup Generator', 'Water Tank'],
      features: ['Modern Kitchen', 'Balcony', 'Large Windows', 'Hardwood Floors', 'Walk-in Closet'],
      propertyDocuments: [],
      governmentAgreementAccepted: true,
      ownerId: landlord1.id,
    },
    {
      title: 'Spacious 3BR House in CMC',
      description: 'Lovely family house in CMC area with private garden and ample parking space. Perfect for families looking for a peaceful residential area.',
      address: 'CMC Road, Behind International School',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      zipCode: '1000',
      country: 'Ethiopia',
      propertyType: 'HOUSE',
      listingType: 'RENT',
      bedrooms: 3,
      bathrooms: 2,
      area: 150,
      furnished: false,
      yearBuilt: 2018,
      parkingSpaces: 2,
      rentAmount: 25000,
      deposit: 50000,
      currency: 'ETB',
      status: 'AVAILABLE',
      available: true,
      images: [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
      ],
      amenities: ['Garden', 'Parking', 'Security', 'Water Tank', 'Backup Generator'],
      features: ['Large Garden', 'Storage Room', 'Updated Kitchen', 'High Ceilings', 'Fireplace'],
      propertyDocuments: [],
      governmentAgreementAccepted: true,
      ownerId: landlord1.id,
    },
    {
      title: 'Luxury Studio in Kazanchis',
      description: 'Fully furnished luxury studio apartment in prime Kazanchis location. Perfect for young professionals. Walking distance to restaurants and entertainment.',
      address: 'Kazanchis, Near UNECA',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      zipCode: '1000',
      country: 'Ethiopia',
      propertyType: 'STUDIO',
      listingType: 'RENT',
      bedrooms: 1,
      bathrooms: 1,
      area: 45,
      furnished: true,
      yearBuilt: 2021,
      parkingSpaces: 1,
      floorNumber: 3,
      totalFloors: 6,
      rentAmount: 12000,
      deposit: 24000,
      currency: 'ETB',
      status: 'AVAILABLE',
      available: true,
      images: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
      ],
      amenities: ['WiFi', 'Parking', 'Security', 'Elevator', 'Gym', 'Furnished Kitchen'],
      features: ['Modern Kitchen', 'Balcony', 'Modern Bathroom', 'Built-in Wardrobe'],
      propertyDocuments: [],
      governmentAgreementAccepted: true,
      ownerId: landlord2.id,
    },
    {
      title: 'Beautiful 4BR Villa in Old Airport',
      description: 'Stunning villa with beautiful architecture and landscaped garden. Features include swimming pool, gym, and staff quarters. Ideal for executives and diplomats.',
      address: 'Old Airport Road, Behind ECA',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      zipCode: '1000',
      country: 'Ethiopia',
      propertyType: 'VILLA',
      listingType: 'RENT',
      bedrooms: 4,
      bathrooms: 3.5,
      area: 350,
      furnished: true,
      yearBuilt: 2019,
      parkingSpaces: 3,
      rentAmount: 75000,
      deposit: 150000,
      currency: 'ETB',
      status: 'AVAILABLE',
      available: true,
      images: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
      ],
      amenities: ['Swimming Pool', 'Gym', 'Garden', 'Security', 'Parking', 'WiFi', 'Backup Generator', 'Water Tank'],
      features: ['Modern Kitchen', 'Large Windows', 'High Ceilings', 'Walk-in Closet', 'Staff Quarters', 'Fireplace'],
      propertyDocuments: [],
      governmentAgreementAccepted: true,
      ownerId: landlord2.id,
    },
    {
      title: 'Affordable 1BR in Megenagna',
      description: 'Clean and comfortable one-bedroom apartment in Megenagna area. Close to public transportation and shopping centers. Great value for money.',
      address: 'Megenagna, Near Flamingo',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      zipCode: '1000',
      country: 'Ethiopia',
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      bedrooms: 1,
      bathrooms: 1,
      area: 55,
      furnished: false,
      yearBuilt: 2015,
      parkingSpaces: 1,
      floorNumber: 2,
      totalFloors: 4,
      rentAmount: 8000,
      deposit: 16000,
      currency: 'ETB',
      status: 'RENTED',
      available: false,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'
      ],
      amenities: ['Parking', 'Security', 'Water Tank'],
      features: ['Tile Flooring', 'Storage Room'],
      propertyDocuments: [],
      governmentAgreementAccepted: true,
      ownerId: landlord3.id,
    },
    {
      title: 'Penthouse 3BR in Sarbet',
      description: 'Exclusive penthouse with panoramic views of the city. Features include private terrace, modern appliances, and premium finishes throughout.',
      address: 'Sarbet Area, Near German Embassy',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      zipCode: '1000',
      country: 'Ethiopia',
      propertyType: 'PENTHOUSE',
      listingType: 'RENT',
      bedrooms: 3,
      bathrooms: 2.5,
      area: 180,
      furnished: true,
      yearBuilt: 2022,
      parkingSpaces: 2,
      floorNumber: 10,
      totalFloors: 10,
      rentAmount: 45000,
      deposit: 90000,
      currency: 'ETB',
      status: 'AVAILABLE',
      available: true,
      images: [
        'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800'
      ],
      amenities: ['WiFi', 'Parking', 'Security', 'Elevator', 'Gym', 'Swimming Pool', 'Backup Generator'],
      features: ['Modern Kitchen', 'Large Windows', 'High Ceilings', 'Walk-in Closet', 'Private Terrace', 'City Views'],
      propertyDocuments: [],
      governmentAgreementAccepted: true,
      ownerId: landlord3.id,
    },
    {
      title: 'Cozy 2BR in Gerji',
      description: 'Comfortable two-bedroom apartment in the growing Gerji area. Close to new developments and shopping malls. Quiet and safe neighborhood.',
      address: 'Gerji, Behind Mall of Africa',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      zipCode: '1000',
      country: 'Ethiopia',
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      bedrooms: 2,
      bathrooms: 1,
      area: 75,
      furnished: false,
      yearBuilt: 2019,
      parkingSpaces: 1,
      floorNumber: 3,
      totalFloors: 5,
      rentAmount: 13000,
      deposit: 26000,
      currency: 'ETB',
      status: 'AVAILABLE',
      available: true,
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
      ],
      amenities: ['Parking', 'Security', 'Elevator', 'Water Tank', 'Backup Generator'],
      features: ['Balcony', 'Storage Room', 'Updated Kitchen'],
      propertyDocuments: [],
      governmentAgreementAccepted: true,
      ownerId: landlord1.id,
    },
    {
      title: 'Office Space in Mexico Square',
      description: 'Prime commercial office space in Mexico Square. Perfect for startups and small businesses. Includes reception area and meeting rooms.',
      address: 'Mexico Square, Main Road',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      zipCode: '1000',
      country: 'Ethiopia',
      propertyType: 'OFFICE',
      listingType: 'RENT',
      bedrooms: 0,
      bathrooms: 2,
      area: 120,
      furnished: false,
      yearBuilt: 2017,
      parkingSpaces: 3,
      floorNumber: 2,
      totalFloors: 6,
      rentAmount: 35000,
      deposit: 70000,
      currency: 'ETB',
      status: 'AVAILABLE',
      available: true,
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
      ],
      amenities: ['WiFi', 'Parking', 'Security', 'Elevator', 'Backup Generator', 'Conference Room'],
      features: ['Open Floor Plan', 'Large Windows', 'Modern Bathroom', 'Kitchen Area'],
      propertyDocuments: [],
      governmentAgreementAccepted: true,
      ownerId: landlord2.id,
    },
  ];

  for (const property of properties) {
    await prisma.property.create({
      data: property,
    });
  }

  console.log('✅ Created demo properties');

  // Create a rental and payments for the rented property
  const rentedProperty = await prisma.property.findFirst({
    where: { status: 'RENTED' }
  });

  if (rentedProperty) {
    const rental = await prisma.rental.create({
      data: {
        propertyId: rentedProperty.id,
        tenantId: tenant1.id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        rentAmount: rentedProperty.rentAmount || 8000,
        deposit: rentedProperty.deposit || 16000,
        status: 'ACTIVE',
      },
    });

    // Create some payment records
    const payments = [
      {
        rentalId: rental.id,
        userId: tenant1.id,
        amount: rental.rentAmount,
        paymentType: 'RENT',
        status: 'COMPLETED',
        dueDate: new Date('2024-01-01'),
        paidAt: new Date('2024-01-01'),
        gateway: 'CHAPA',
        transactionId: 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      },
      {
        rentalId: rental.id,
        userId: tenant1.id,
        amount: rental.rentAmount,
        paymentType: 'RENT',
        status: 'COMPLETED',
        dueDate: new Date('2024-02-01'),
        paidAt: new Date('2024-02-01'),
        gateway: 'CHAPA',
        transactionId: 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      },
      {
        rentalId: rental.id,
        userId: tenant1.id,
        amount: rental.rentAmount,
        paymentType: 'RENT',
        status: 'PENDING',
        dueDate: new Date('2024-03-01'),
      },
    ];

    for (const payment of payments) {
      await prisma.payment.create({ data: payment });
    }

    console.log('✅ Created demo rental and payments');

    // Create maintenance request
    await prisma.maintenanceRequest.create({
      data: {
        propertyId: rentedProperty.id,
        requesterId: tenant1.id,
        title: 'Leaking Kitchen Faucet',
        description: 'The kitchen faucet has been leaking for the past few days. Water is dripping constantly even when turned off completely.',
        priority: 'MEDIUM',
        status: 'PENDING',
        estimatedCost: 1500,
        images: [],
      },
    });

    console.log('✅ Created demo maintenance request');
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📝 Demo Credentials:');
  console.log('Landlord 1: landlord1@homie.et / password123');
  console.log('Landlord 2: landlord2@homie.et / password123');
  console.log('Landlord 3: landlord3@homie.et / password123');
  console.log('Tenant 1: tenant1@homie.et / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
