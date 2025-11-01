import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.userMetricEntry.deleteMany();
  await prisma.userClassElo.deleteMany();
  await prisma.user.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.metric.deleteMany();
  await prisma.class.deleteMany();

  console.log('🧹 Cleared existing data');

  // Create the 5 fixed classes
  const classes = await Promise.all([
    prisma.class.create({
      data: {
        slug: 'titan',
        name: 'The Titan',
      },
    }),
    prisma.class.create({
      data: {
        slug: 'beast',
        name: 'The Beast',
      },
    }),
    prisma.class.create({
      data: {
        slug: 'bodyweight_master',
        name: 'The Body Weight Master',
      },
    }),
    prisma.class.create({
      data: {
        slug: 'hunter_gatherer',
        name: 'The Hunter Gatherer',
      },
    }),
    prisma.class.create({
      data: {
        slug: 'super_athlete',
        name: 'The Super Athlete',
      },
    }),
  ]);

  console.log('🏆 Created 5 fixed classes');

  // Create gyms with real coordinates
  const gyms = await Promise.all([
    prisma.gym.create({
      data: {
        name: 'Gold\'s Gym Venice',
        street: '360 Hampton Dr',
        city: 'Venice',
        state: 'CA',
        country: 'USA',
        lat: 33.9850,
        lng: -118.4695,
      },
    }),
    prisma.gym.create({
      data: {
        name: 'Equinox West Hollywood',
        street: '8590 Sunset Blvd',
        city: 'West Hollywood',
        state: 'CA',
        country: 'USA',
        lat: 34.0928,
        lng: -118.3737,
      },
    }),
    prisma.gym.create({
      data: {
        name: 'LA Fitness Downtown',
        street: '800 W 7th St',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        lat: 34.0522,
        lng: -118.2437,
      },
    }),
    prisma.gym.create({
      data: {
        name: 'Planet Fitness Hollywood',
        street: '6201 Hollywood Blvd',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        lat: 34.1016,
        lng: -118.3267,
      },
    }),
    prisma.gym.create({
      data: {
        name: '24 Hour Fitness Santa Monica',
        street: '1428 4th St',
        city: 'Santa Monica',
        state: 'CA',
        country: 'USA',
        lat: 34.0195,
        lng: -118.4912,
      },
    }),
    prisma.gym.create({
      data: {
        name: 'Crunch Fitness Beverly Hills',
        street: '8383 Beverly Blvd',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        lat: 34.0736,
        lng: -118.4001,
      },
    }),
    prisma.gym.create({
      data: {
        name: 'Anytime Fitness Culver City',
        street: '10862 Washington Blvd',
        city: 'Culver City',
        state: 'CA',
        country: 'USA',
        lat: 34.0211,
        lng: -118.3965,
      },
    }),
    prisma.gym.create({
      data: {
        name: 'Fitness 19 Marina del Rey',
        street: '13400 Maxella Ave',
        city: 'Marina del Rey',
        state: 'CA',
        country: 'USA',
        lat: 33.9803,
        lng: -118.4517,
      },
    }),
  ]);

  console.log('🏢 Created gyms with real coordinates');

  // Create placeholder metrics for each class
  await Promise.all([
    // Titan class metrics
    prisma.metric.create({
      data: {
        slug: 'bench_press',
        name: 'Bench Press',
        unit: 'lbs',
        higherIsBetter: true,
        weight: 1,
        group: 'Strength',
        rankBreakpoints: { bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315 },
        classId: classes[0].id,
      },
    }),
    prisma.metric.create({
      data: {
        slug: 'deadlift',
        name: 'Deadlift',
        unit: 'lbs',
        higherIsBetter: true,
        weight: 1,
        group: 'Strength',
        rankBreakpoints: { bronze: 185, silver: 225, gold: 315, platinum: 405, diamond: 495 },
        classId: classes[0].id,
      },
    }),
    prisma.metric.create({
      data: {
        slug: 'squat',
        name: 'Squat',
        unit: 'lbs',
        higherIsBetter: true,
        weight: 1,
        group: 'Strength',
        rankBreakpoints: { bronze: 135, silver: 185, gold: 225, platinum: 315, diamond: 405 },
        classId: classes[0].id,
      },
    }),

    // Beast class metrics
    prisma.metric.create({
      data: {
        slug: 'power_clean',
        name: 'Power Clean',
        unit: 'lbs',
        higherIsBetter: true,
        weight: 1,
        group: 'Power',
        rankBreakpoints: { bronze: 95, silver: 135, gold: 185, platinum: 225, diamond: 275 },
        classId: classes[1].id,
      },
    }),
    prisma.metric.create({
      data: {
        slug: 'snatch',
        name: 'Snatch',
        unit: 'lbs',
        higherIsBetter: true,
        weight: 1,
        group: 'Power',
        rankBreakpoints: { bronze: 65, silver: 95, gold: 135, platinum: 185, diamond: 225 },
        classId: classes[1].id,
      },
    }),

    // Bodyweight Master metrics
    prisma.metric.create({
      data: {
        slug: 'pull_ups',
        name: 'Pull-ups',
        unit: 'reps',
        higherIsBetter: true,
        weight: 1,
        group: 'Bodyweight',
        rankBreakpoints: { bronze: 5, silver: 10, gold: 15, platinum: 20, diamond: 25 },
        classId: classes[2].id,
      },
    }),
    prisma.metric.create({
      data: {
        slug: 'push_ups',
        name: 'Push-ups',
        unit: 'reps',
        higherIsBetter: true,
        weight: 1,
        group: 'Bodyweight',
        rankBreakpoints: { bronze: 20, silver: 35, gold: 50, platinum: 75, diamond: 100 },
        classId: classes[2].id,
      },
    }),
    prisma.metric.create({
      data: {
        slug: 'handstand_hold',
        name: 'Handstand Hold',
        unit: 'seconds',
        higherIsBetter: true,
        weight: 1,
        group: 'Balance',
        rankBreakpoints: { bronze: 10, silver: 30, gold: 60, platinum: 120, diamond: 300 },
        classId: classes[2].id,
      },
    }),

    // Hunter Gatherer metrics
    prisma.metric.create({
      data: {
        slug: '5k_run',
        name: '5K Run',
        unit: 'minutes',
        higherIsBetter: false,
        weight: 1,
        group: 'Endurance',
        rankBreakpoints: { bronze: 25, silver: 22, gold: 20, platinum: 18, diamond: 16 },
        classId: classes[3].id,
      },
    }),
    prisma.metric.create({
      data: {
        slug: 'marathon',
        name: 'Marathon',
        unit: 'hours',
        higherIsBetter: false,
        weight: 1,
        group: 'Endurance',
        rankBreakpoints: { bronze: 4.5, silver: 4, gold: 3.5, platinum: 3, diamond: 2.5 },
        classId: classes[3].id,
      },
    }),

    // Super Athlete metrics
    prisma.metric.create({
      data: {
        slug: 'vertical_jump',
        name: 'Vertical Jump',
        unit: 'inches',
        higherIsBetter: true,
        weight: 1,
        group: 'Explosiveness',
        rankBreakpoints: { bronze: 20, silver: 24, gold: 28, platinum: 32, diamond: 36 },
        classId: classes[4].id,
      },
    }),
    prisma.metric.create({
      data: {
        slug: '40_yard_dash',
        name: '40 Yard Dash',
        unit: 'seconds',
        higherIsBetter: false,
        weight: 1,
        group: 'Speed',
        rankBreakpoints: { bronze: 5.5, silver: 5.0, gold: 4.7, platinum: 4.5, diamond: 4.3 },
        classId: classes[4].id,
      },
    }),
  ]);

  console.log('📊 Created placeholder metrics for each class');

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  // Create admin/test user with rich data
  const adminUser = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || 'michael@natxsocial.com',
      password: hashedPassword,
      displayName: 'Admin User',
      name: 'Administrator',
      gender: 'MALE',
      dateOfBirth: new Date('1985-06-15'),
      primaryClassId: classes[0].id, // Titan
      gymId: gyms[0].id, // Gold's Gym Venice
      overallElo: 1650,
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: 'test@specimenstats.com',
      displayName: 'Test User',
      name: 'Test User',
      gender: 'MALE',
      dateOfBirth: new Date('1990-01-01'),
      primaryClassId: classes[1].id, // Beast
      gymId: gyms[1].id, // Equinox West Hollywood
      overallElo: 1500,
    },
  });

  // Create additional test users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@specimenstats.com',
      displayName: 'Alice Strong',
      name: 'Alice Johnson',
      gender: 'FEMALE',
      dateOfBirth: new Date('1992-03-20'),
      primaryClassId: classes[2].id, // Bodyweight Master
      gymId: gyms[2].id,
      overallElo: 1580,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@specimenstats.com',
      displayName: 'Bob Runner',
      name: 'Bob Williams',
      gender: 'MALE',
      dateOfBirth: new Date('1988-11-10'),
      primaryClassId: classes[3].id, // Hunter Gatherer
      gymId: gyms[3].id,
      overallElo: 1720,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@specimenstats.com',
      displayName: 'Charlie Fast',
      name: 'Charlie Brown',
      gender: 'MALE',
      dateOfBirth: new Date('1995-08-05'),
      primaryClassId: classes[4].id, // Super Athlete
      gymId: gyms[4].id,
      overallElo: 1450,
    },
  });

  const diana = await prisma.user.create({
    data: {
      email: 'diana@specimenstats.com',
      displayName: 'Diana Lifter',
      name: 'Diana Prince',
      gender: 'FEMALE',
      dateOfBirth: new Date('1987-04-12'),
      primaryClassId: classes[0].id, // Titan
      gymId: gyms[5].id,
      overallElo: 1820,
    },
  });

  const users = [alice, bob, charlie, diana];
  console.log(`👥 Created ${users.length} users`);

  // Create friendships (ACCEPTED)
  const friendships = await Promise.all([
    prisma.friendship.create({
      data: {
        requesterId: adminUser.id,
        addresseeId: testUser.id,
        status: 'ACCEPTED',
      },
    }),
    prisma.friendship.create({
      data: {
        requesterId: testUser.id,
        addresseeId: users[0].id, // Alice
        status: 'ACCEPTED',
      },
    }),
    prisma.friendship.create({
      data: {
        requesterId: users[1].id, // Bob
        addresseeId: users[2].id, // Charlie
        status: 'ACCEPTED',
      },
    }),
    prisma.friendship.create({
      data: {
        requesterId: adminUser.id,
        addresseeId: users[3].id, // Diana
        status: 'ACCEPTED',
      },
    }),
  ]);

  console.log(`🤝 Created ${friendships.length} friendships`);

  // Get all metrics for data generation
  const allMetrics = await prisma.metric.findMany();

  // Generate rich time-series data for each user
  for (const user of [adminUser, testUser, ...users]) {
    // Filter metrics for user's class and some cross-class metrics
    const userMetrics = allMetrics.filter(metric => 
      metric.classId === user.primaryClassId || 
      ['bench_press', 'deadlift', 'pull_ups', '5k_run'].includes(metric.slug)
    );

    for (const metric of userMetrics) {
      // Generate 30-90 days of historical data
      const daysOfData = 30 + Math.floor(Math.random() * 60);
      const entries = [];

      // Base value based on user's ELO and metric
      let baseValue = (metric.rankBreakpoints as any)?.silver as number || 100;
      if (user.overallElo > 1600) baseValue = (metric.rankBreakpoints as any)?.gold as number || 150;
      if (user.overallElo > 1700) baseValue = (metric.rankBreakpoints as any)?.platinum as number || 200;

      // Add some randomness
      baseValue *= 0.8 + Math.random() * 0.4;

      for (let day = daysOfData; day >= 0; day--) {
        // Create 1-3 entries per week (not every day)
        if (Math.random() > 0.7) {
          const date = new Date();
          date.setDate(date.getDate() - day);
          
          // Add progressive improvement over time
          const improvement = (daysOfData - day) * 0.002;
          let value = baseValue * (1 + improvement);
          
          // Add some noise
          value *= 0.95 + Math.random() * 0.1;
          
          // Adjust for metric type
          if (!metric.higherIsBetter) {
            value = baseValue / (1 + improvement);
          }
          
          // Round appropriately
          if (metric.unit === 'lbs') {
            value = Math.round(value / 5) * 5; // Round to nearest 5 lbs
          } else if (metric.unit === 'reps') {
            value = Math.round(value);
          } else if (metric.unit === 'seconds') {
            value = Math.round(value);
          } else if (metric.unit === 'minutes') {
            value = Math.round(value * 100) / 100; // 2 decimal places
          } else if (metric.unit === 'hours') {
            value = Math.round(value * 100) / 100;
          } else if (metric.unit === 'inches') {
            value = Math.round(value * 10) / 10; // 1 decimal place
          }

          entries.push({
            userId: user.id,
            metricId: metric.id,
            value: value,
            createdAt: date,
          });
        }
      }

      if (entries.length > 0) {
        await prisma.userMetricEntry.createMany({
          data: entries,
        });
      }
    }
  }

  console.log('📈 Generated rich time-series data for all users');

  // Create notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        body: 'Alice Strong sent you a friend request',
        data: JSON.stringify({ fromUserId: users[0].id }),
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: 'ACHIEVEMENT',
        title: 'ELO Increased!',
        body: 'Your bench press improvement boosted your ELO by 15 points',
        data: JSON.stringify({ points: 15, metric: 'bench_press' }),
        readAt: new Date(),
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id, // Bob
        type: 'ACHIEVEMENT',
        title: 'Leaderboard Update',
        body: 'You climbed to #3 in your gym for 5K runs!',
        data: JSON.stringify({ oldRank: 5, newRank: 3, metric: '5k_run' }),
      },
    }),
    prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'FRIEND_ACCEPTED',
        title: 'Friend Request Accepted',
        body: 'Alice Strong accepted your friend request',
        data: JSON.stringify({ acceptedUserId: users[0].id }),
      },
    }),
  ]);

  console.log(`🔔 Created ${notifications.length} notifications`);

  // Summary
  const userCount = await prisma.user.count();
  const metricCount = await prisma.metric.count();
  const entryCount = await prisma.userMetricEntry.count();
  const gymCount = await prisma.gym.count();
  const friendshipCount = await prisma.friendship.count();
  const notificationCount = await prisma.notification.count();

  console.log('\n🎉 Seeding Summary:');
  console.log(`👥 Users: ${userCount}`);
  console.log(`🏢 Gyms: ${gymCount}`);
  console.log(`📊 Metrics: ${metricCount}`);
  console.log(`📈 Entries: ${entryCount}`);
  console.log(`🤝 Friendships: ${friendshipCount}`);
  console.log(`🔔 Notifications: ${notificationCount}`);
  console.log('\n✅ Database seeding completed successfully!');
  
  // Dev log line
  if (process.env.NODE_ENV === 'development') {
    console.log(JSON.stringify({
      level: 'info',
      scope: 'dev',
      msg: 'Seeded admin',
      email: adminUser.email,
      password: 'Admin123!'
    }));
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 