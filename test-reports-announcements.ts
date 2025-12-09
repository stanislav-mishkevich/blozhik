import * as db from './server/db';

async function test() {
  console.log('Testing announcements...');
  const announcements = await db.getAnnouncements();
  console.log('Announcements:', announcements);
  
  console.log('\nTesting reports...');
  const reports = await db.getReports({ limit: 10, offset: 0 });
  console.log('Reports:', reports);
}

test().catch(console.error);
