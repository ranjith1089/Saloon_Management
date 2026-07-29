import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data
  console.log('🧹 Cleaning up existing data...');
  await prisma.review.deleteMany();
  await prisma.staffEarning.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.tax.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  await prisma.staffSchedule.deleteMany();
  await prisma.staffService.deleteMany();
  await prisma.branchService.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.city.deleteMany();
  await prisma.state.deleteMany();
  await prisma.country.deleteMany();

  // 1. Create Location Data
  console.log('🌍 Creating locations...');
  const india = await prisma.country.create({
    data: { name: 'India', code: 'IN' },
  });
  const usa = await prisma.country.create({
    data: { name: 'United States', code: 'US' },
  });

  const karnataka = await prisma.state.create({
    data: { name: 'Karnataka', countryId: india.id },
  });
  const tamilnadu = await prisma.state.create({
    data: { name: 'Tamil Nadu', countryId: india.id },
  });

  const bangalore = await prisma.city.create({
    data: { name: 'Bangalore', stateId: karnataka.id },
  });
  const mysore = await prisma.city.create({
    data: { name: 'Mysore', stateId: karnataka.id },
  });
  const chennai = await prisma.city.create({
    data: { name: 'Chennai', stateId: tamilnadu.id },
  });

  // 2. Create Users (Admin, Manager, Staff, Customers)
  console.log('👤 Creating users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@salon.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Salon',
          lastName: 'Admin',
          phone: '+919876543210',
        },
      },
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@salon.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Salon',
          lastName: 'Manager',
          phone: '+919876543211',
        },
      },
    },
  });

  // 3. Create Branches
  console.log('🏢 Creating branches...');
  const branch1 = await prisma.branch.create({
    data: {
      name: 'Glamour Cuts',
      description: 'Premium hair salon in Bangalore',
      address: '123 MG Road, Bangalore',
      cityId: bangalore.id,
      phone: '+918012345678',
      email: 'glamour@salon.com',
      openTime: '09:00',
      closeTime: '21:00',
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      name: 'Serene Styles',
      description: 'Luxury spa & salon',
      address: '456 Brigade Road, Bangalore',
      cityId: bangalore.id,
      phone: '+918012345679',
      email: 'serene@salon.com',
      openTime: '10:00',
      closeTime: '22:00',
    },
  });

  const branch3 = await prisma.branch.create({
    data: {
      name: 'Trendy Trims',
      description: 'Modern unisex salon',
      address: '789 Anna Nagar, Chennai',
      cityId: chennai.id,
      phone: '+918012345680',
      email: 'trendy@salon.com',
      openTime: '09:00',
      closeTime: '21:00',
    },
  });

  // 4. Create Service Categories
  console.log('📁 Creating service categories...');
  const hairCare = await prisma.serviceCategory.create({
    data: { name: 'Hair Care', description: 'Hair related services' },
  });
  const grooming = await prisma.serviceCategory.create({
    data: { name: 'Grooming', description: 'Beauty grooming services' },
  });
  const spa = await prisma.serviceCategory.create({
    data: { name: 'Spa & Wellness', description: 'Relaxation services' },
  });
  const nailCare = await prisma.serviceCategory.create({
    data: { name: 'Nail Care', description: 'Nail treatments' },
  });

  // Sub-categories
  const haircut = await prisma.serviceCategory.create({
    data: { name: 'Haircut', parentId: hairCare.id },
  });
  const hairColor = await prisma.serviceCategory.create({
    data: { name: 'Hair Coloring', parentId: hairCare.id },
  });
  const facial = await prisma.serviceCategory.create({
    data: { name: 'Facial', parentId: grooming.id },
  });
  const massage = await prisma.serviceCategory.create({
    data: { name: 'Massage', parentId: spa.id },
  });

  // 5. Create Services
  console.log('💇 Creating services...');
  const service1 = await prisma.service.create({
    data: {
      name: "Men's Haircut",
      description: 'Professional men haircut with styling',
      price: 500,
      duration: 45,
      categoryId: haircut.id,
      branches: {
        create: [{ branchId: branch1.id }, { branchId: branch2.id }, { branchId: branch3.id }],
      },
    },
  });

  const service2 = await prisma.service.create({
    data: {
      name: "Women's Haircut",
      description: 'Professional women haircut with layers',
      price: 800,
      duration: 60,
      categoryId: haircut.id,
      branches: {
        create: [{ branchId: branch1.id }, { branchId: branch2.id }],
      },
    },
  });

  const service3 = await prisma.service.create({
    data: {
      name: 'Hair Color - Global',
      description: 'Full hair coloring with premium color',
      price: 2500,
      duration: 120,
      categoryId: hairColor.id,
      branches: {
        create: [{ branchId: branch1.id }, { branchId: branch2.id }],
      },
    },
  });

  const service4 = await prisma.service.create({
    data: {
      name: 'Beard Trim',
      description: 'Professional beard styling',
      price: 250,
      duration: 30,
      categoryId: grooming.id,
      branches: {
        create: [{ branchId: branch1.id }, { branchId: branch3.id }],
      },
    },
  });

  const service5 = await prisma.service.create({
    data: {
      name: 'Deep Cleansing Facial',
      description: 'Complete facial with cleansing & massage',
      price: 1200,
      duration: 60,
      categoryId: facial.id,
      branches: {
        create: [{ branchId: branch1.id }, { branchId: branch2.id }, { branchId: branch3.id }],
      },
    },
  });

  const service6 = await prisma.service.create({
    data: {
      name: 'Full Body Massage',
      description: '60-minute relaxing full body massage',
      price: 1800,
      duration: 60,
      categoryId: massage.id,
      branches: {
        create: [{ branchId: branch2.id }],
      },
    },
  });

  const service7 = await prisma.service.create({
    data: {
      name: 'Manicure',
      description: 'Professional manicure treatment',
      price: 400,
      duration: 45,
      categoryId: nailCare.id,
      branches: {
        create: [{ branchId: branch1.id }, { branchId: branch2.id }],
      },
    },
  });

  const service8 = await prisma.service.create({
    data: {
      name: 'Pedicure',
      description: 'Professional pedicure treatment',
      price: 500,
      duration: 45,
      categoryId: nailCare.id,
      branches: {
        create: [{ branchId: branch1.id }, { branchId: branch2.id }],
      },
    },
  });

  // 6. Create Staff
  console.log('👨‍💼 Creating staff...');
  const staffUser1 = await prisma.user.create({
    data: {
      email: 'staff@salon.com',
      passwordHash: staffPassword,
      role: 'STAFF',
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Rahul',
          lastName: 'Kumar',
          phone: '+919876543212',
          gender: 'MALE',
        },
      },
      staff: {
        create: {
          employeeCode: 'EMP001',
          branchId: branch1.id,
          designation: 'Senior Stylist',
          salary: 25000,
          commissionRate: 10,
          isVerified: true,
          bio: '5+ years experience in hairstyling',
          experience: 5,
          services: {
            create: [
              { serviceId: service1.id },
              { serviceId: service4.id },
            ],
          },
          schedules: {
            create: [
              { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
              { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
              { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
              { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
              { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
              { dayOfWeek: 6, startTime: '10:00', endTime: '20:00' },
              { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isOff: true },
            ],
          },
        },
      },
    },
    include: { staff: true },
  });

  const staffUser2 = await prisma.user.create({
    data: {
      email: 'priya@salon.com',
      passwordHash: staffPassword,
      role: 'STAFF',
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Priya',
          lastName: 'Sharma',
          phone: '+919876543213',
          gender: 'FEMALE',
        },
      },
      staff: {
        create: {
          employeeCode: 'EMP002',
          branchId: branch1.id,
          designation: 'Beauty Expert',
          salary: 22000,
          commissionRate: 12,
          isVerified: true,
          experience: 3,
          services: {
            create: [
              { serviceId: service2.id },
              { serviceId: service3.id },
              { serviceId: service5.id },
              { serviceId: service7.id },
              { serviceId: service8.id },
            ],
          },
          schedules: {
            create: [
              { dayOfWeek: 1, startTime: '10:00', endTime: '19:00' },
              { dayOfWeek: 2, startTime: '10:00', endTime: '19:00' },
              { dayOfWeek: 3, startTime: '10:00', endTime: '19:00' },
              { dayOfWeek: 4, startTime: '10:00', endTime: '19:00' },
              { dayOfWeek: 5, startTime: '10:00', endTime: '19:00' },
              { dayOfWeek: 6, startTime: '10:00', endTime: '20:00' },
              { dayOfWeek: 0, startTime: '11:00', endTime: '18:00' },
            ],
          },
        },
      },
    },
    include: { staff: true },
  });

  const staffUser3 = await prisma.user.create({
    data: {
      email: 'amit@salon.com',
      passwordHash: staffPassword,
      role: 'STAFF',
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Amit',
          lastName: 'Patel',
          phone: '+919876543214',
          gender: 'MALE',
        },
      },
      staff: {
        create: {
          employeeCode: 'EMP003',
          branchId: branch2.id,
          designation: 'Massage Therapist',
          salary: 28000,
          commissionRate: 15,
          isVerified: true,
          experience: 7,
          services: {
            create: [{ serviceId: service6.id }, { serviceId: service5.id }],
          },
          schedules: {
            create: [
              { dayOfWeek: 1, startTime: '10:00', endTime: '20:00' },
              { dayOfWeek: 2, startTime: '10:00', endTime: '20:00' },
              { dayOfWeek: 3, startTime: '10:00', endTime: '20:00' },
              { dayOfWeek: 4, startTime: '10:00', endTime: '20:00' },
              { dayOfWeek: 5, startTime: '10:00', endTime: '20:00' },
              { dayOfWeek: 6, startTime: '10:00', endTime: '22:00' },
              { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isOff: true },
            ],
          },
        },
      },
    },
    include: { staff: true },
  });

  // 7. Create Customers
  console.log('👥 Creating customers...');
  const customers = [];
  const customerData = [
    { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+919876500001' },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '+919876500002' },
    { firstName: 'Raj', lastName: 'Verma', email: 'raj@example.com', phone: '+919876500003' },
    { firstName: 'Anita', lastName: 'Desai', email: 'anita@example.com', phone: '+919876500004' },
    { firstName: 'Vikram', lastName: 'Singh', email: 'vikram@example.com', phone: '+919876500005' },
  ];

  for (const c of customerData) {
    const cust = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: customerPassword,
        role: 'CUSTOMER',
        emailVerified: true,
        profile: {
          create: {
            firstName: c.firstName,
            lastName: c.lastName,
            phone: c.phone,
          },
        },
        customer: {
          create: {
            loyaltyPoints: Math.floor(Math.random() * 500),
            totalVisits: Math.floor(Math.random() * 10),
          },
        },
      },
    });
    customers.push(cust);
  }

  // 8. Create Sample Bookings
  console.log('📅 Creating sample bookings...');
  const today = new Date();
  const services = [service1, service2, service4, service5];
  const staffs = [staffUser1.staff!, staffUser2.staff!, staffUser3.staff!];

  for (let i = 0; i < 8; i++) {
    const bookingDate = new Date(today);
    bookingDate.setDate(today.getDate() + Math.floor(i / 3));
    const startHour = 10 + (i % 5) * 2;
    const startTime = `${String(startHour).padStart(2, '0')}:00`;
    const service = services[i % services.length];
    const duration = service.duration;
    const endMins = startHour * 60 + duration;
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    await prisma.booking.create({
      data: {
        bookingNumber: `BK${Date.now()}${i}`,
        customerId: customers[i % customers.length].id,
        staffId: staffs[i % staffs.length].id,
        branchId: branch1.id,
        serviceId: service.id,
        bookingDate,
        startTime,
        endTime,
        status: i < 3 ? 'COMPLETED' : 'CONFIRMED',
        totalAmount: service.price,
        paymentStatus: i < 3 ? 'PAID' : 'PENDING',
      },
    });
  }

  // 9. Create Taxes
  console.log('💰 Creating taxes...');
  await prisma.tax.create({
    data: { name: 'GST', rate: 18, description: 'Goods & Services Tax', isActive: true, isDefault: true },
  });
  await prisma.tax.create({
    data: { name: 'Service Tax', rate: 5, description: 'Service tax', isActive: true },
  });

  // 10. Create Coupons
  console.log('🎟️ Creating coupons...');
  const validFrom = new Date();
  const validTo = new Date();
  validTo.setMonth(validTo.getMonth() + 3);

  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      name: 'Welcome Discount',
      description: '10% off on first booking',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscount: 500,
      usageLimit: 100,
      perUserLimit: 1,
      validFrom,
      validTo,
    },
  });
  await prisma.coupon.create({
    data: {
      code: 'FLAT200',
      name: 'Flat ₹200 Off',
      description: 'Flat ₹200 off on orders above ₹1000',
      discountType: 'FIXED',
      discountValue: 200,
      minOrderAmount: 1000,
      usageLimit: 50,
      validFrom,
      validTo,
    },
  });

  // 11. Notification Templates
  console.log('📧 Creating notification templates...');
  await prisma.notificationTemplate.create({
    data: {
      name: 'booking-confirmation-email',
      type: 'BOOKING_CREATED',
      channel: 'EMAIL',
      subject: 'Booking Confirmed - {{serviceName}}',
      body: 'Hi {{customerName}}, your booking for {{serviceName}} on {{date}} at {{time}} has been confirmed at {{branchName}}. See you soon!',
      variables: { customerName: 'string', serviceName: 'string', date: 'string', time: 'string', branchName: 'string' },
    },
  });
  await prisma.notificationTemplate.create({
    data: {
      name: 'booking-reminder-sms',
      type: 'BOOKING_REMINDER',
      channel: 'SMS',
      subject: null,
      body: 'Reminder: Your appointment for {{serviceName}} is scheduled at {{time}} today at {{branchName}}.',
      variables: { serviceName: 'string', time: 'string', branchName: 'string' },
    },
  });
  await prisma.notificationTemplate.create({
    data: {
      name: 'promotional-offer',
      type: 'PROMOTION',
      channel: 'EMAIL',
      subject: 'Special Offer Just For You!',
      body: 'Hi {{customerName}}, enjoy {{discount}}% off on your next visit. Use code {{code}}. Valid till {{expiryDate}}.',
      variables: { customerName: 'string', discount: 'string', code: 'string', expiryDate: 'string' },
    },
  });

  // 12. Create Sample Reviews & Earnings for completed bookings
  console.log('⭐ Creating reviews & earnings for completed bookings...');
  const completedBookings = await prisma.booking.findMany({
    where: { status: 'COMPLETED' },
    include: { staff: true },
  });

  for (const b of completedBookings) {
    // Create earning
    const commissionRate = Number(b.staff.commissionRate || 10);
    const commissionAmount = (Number(b.totalAmount) * commissionRate) / 100;
    await prisma.staffEarning.create({
      data: {
        staffId: b.staffId,
        bookingId: b.id,
        baseAmount: b.totalAmount,
        commissionRate,
        commissionAmount,
      },
    });

    // Create review (60% chance)
    if (Math.random() > 0.4) {
      const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
      await prisma.review.create({
        data: {
          bookingId: b.id,
          customerId: b.customerId,
          staffId: b.staffId,
          serviceId: b.serviceId,
          rating,
          comment: rating === 5 ? 'Excellent service! Highly recommend.' : 'Great experience, will visit again.',
        },
      });
    }
  }

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Default Credentials:');
  console.log('   Admin:    admin@salon.com / admin123');
  console.log('   Manager:  manager@salon.com / manager123');
  console.log('   Staff:    staff@salon.com / staff123');
  console.log('   Customer: john@example.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
