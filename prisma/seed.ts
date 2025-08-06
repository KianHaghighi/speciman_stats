const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create demo users with realistic performance data
  const users = [
    {
      name: 'Alex Thompson',
      email: 'alex@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      metrics: {
        'Bench Press': { value: 225, percentile: 85 },
        'Squat': { value: 315, percentile: 80 },
        'Deadlift': { value: 405, percentile: 90 },
        'Pull-ups': { value: 15, percentile: 75 },
        'Mile Run': { value: 6.5, percentile: 70 },
      },
    },
    {
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      metrics: {
        'Bench Press': { value: 135, percentile: 65 },
        'Squat': { value: 225, percentile: 70 },
        'Deadlift': { value: 275, percentile: 65 },
        'Pull-ups': { value: 8, percentile: 60 },
        'Mile Run': { value: 7.2, percentile: 65 },
      },
    },
    {
      name: 'Marcus Johnson',
      email: 'marcus@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
      metrics: {
        'Bench Press': { value: 315, percentile: 95 },
        'Squat': { value: 405, percentile: 95 },
        'Deadlift': { value: 495, percentile: 98 },
        'Pull-ups': { value: 25, percentile: 95 },
        'Mile Run': { value: 5.8, percentile: 85 },
      },
    },
    {
      name: 'Liam Patel',
      email: 'liam@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam',
      metrics: {
        'Bench Press': { value: 185, percentile: 70 },
        'Squat': { value: 275, percentile: 75 },
        'Deadlift': { value: 335, percentile: 80 },
        'Pull-ups': { value: 12, percentile: 70 },
        'Mile Run': { value: 6.9, percentile: 68 },
      },
    },
    {
      name: 'Emily Rivera',
      email: 'emily@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      metrics: {
        'Bench Press': { value: 95, percentile: 50 },
        'Squat': { value: 185, percentile: 60 },
        'Deadlift': { value: 205, percentile: 55 },
        'Pull-ups': { value: 5, percentile: 40 },
        'Mile Run': { value: 8.0, percentile: 50 },
      },
    },
    {
      name: 'Noah Kim',
      email: 'noah@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah',
      metrics: {
        'Bench Press': { value: 205, percentile: 75 },
        'Squat': { value: 295, percentile: 78 },
        'Deadlift': { value: 365, percentile: 85 },
        'Pull-ups': { value: 10, percentile: 65 },
        'Mile Run': { value: 7.0, percentile: 60 },
      },
    },
    {
      name: 'Olivia Smith',
      email: 'olivia@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
      metrics: {
        'Bench Press': { value: 115, percentile: 55 },
        'Squat': { value: 165, percentile: 55 },
        'Deadlift': { value: 225, percentile: 60 },
        'Pull-ups': { value: 6, percentile: 45 },
        'Mile Run': { value: 7.8, percentile: 55 },
      },
    },
    {
      name: 'Ethan Lee',
      email: 'ethan@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan',
      metrics: {
        'Bench Press': { value: 255, percentile: 88 },
        'Squat': { value: 335, percentile: 85 },
        'Deadlift': { value: 425, percentile: 92 },
        'Pull-ups': { value: 18, percentile: 80 },
        'Mile Run': { value: 6.2, percentile: 75 },
      },
    },
    {
      name: 'Sophia Garcia',
      email: 'sophia@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
      metrics: {
        'Bench Press': { value: 105, percentile: 52 },
        'Squat': { value: 155, percentile: 52 },
        'Deadlift': { value: 195, percentile: 52 },
        'Pull-ups': { value: 4, percentile: 35 },
        'Mile Run': { value: 8.5, percentile: 40 },
      },
    },
    {
      name: 'Jackson Wu',
      email: 'jackson@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jackson',
      metrics: {
        'Bench Press': { value: 175, percentile: 65 },
        'Squat': { value: 245, percentile: 68 },
        'Deadlift': { value: 315, percentile: 75 },
        'Pull-ups': { value: 9, percentile: 60 },
        'Mile Run': { value: 7.5, percentile: 58 },
      },
    },
    {
      name: 'Mia Rossi',
      email: 'mia@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
      metrics: {
        'Bench Press': { value: 125, percentile: 60 },
        'Squat': { value: 195, percentile: 62 },
        'Deadlift': { value: 235, percentile: 65 },
        'Pull-ups': { value: 7, percentile: 50 },
        'Mile Run': { value: 8.2, percentile: 48 },
      },
    },
  ];

  // Create metrics
  const metrics = [
    { name: 'Bench Press', unit: 'lbs', category: 'The Titan' },
    { name: 'Squat', unit: 'lbs', category: 'The Titan' },
    { name: 'Deadlift', unit: 'lbs', category: 'The Titan' },
    { name: 'Pull-ups', unit: 'reps', category: 'Bodyweight Master' },
    { name: 'Push-ups', unit: 'reps', category: 'Bodyweight Master' },
    { name: 'Dips', unit: 'reps', category: 'Bodyweight Master' },
    { name: 'Mile Run', unit: 'minutes', category: 'Super Athlete' },
    { name: '100m Dash', unit: 'seconds', category: 'Super Athlete' },
    { name: '5k Run', unit: 'minutes', category: 'Hunter Gatherer' },
    { name: '10k Run', unit: 'minutes', category: 'Hunter Gatherer' },
    // Add more metrics and assign to categories as needed
  ];

  // Create metrics in the database
  for (const metric of metrics) {
    await prisma.metric.upsert({
      where: { name: metric.name },
      update: {},
      create: metric,
    });
  }

  // Create users and their entries
  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });

    // Create entries for each metric
    for (const [metricName, data] of Object.entries(user.metrics)) {
      const metric = await prisma.metric.findUnique({
        where: { name: metricName },
      });

      if (metric) {
        await prisma.entry.create({
          data: {
            metric_id: metric.id,
            user_id: createdUser.id,
            value: data.value,
          },
        });
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 