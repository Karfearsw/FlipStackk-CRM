import { db } from '@/lib/db';
import { users, marketingWorkflows, channelMembers, messages, leads, deals } from '@/db/schema';
import { sql, ne, eq } from 'drizzle-orm';

async function cleanupTeamMembers() {
  try {
    console.log('🧹 Cleaning up team member data...');
    
    // First, let's see what users we have
    const allUsers = await db.query.users.findMany();
    console.log('📋 Current users in database:');
    allUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Find the abcakdoor admin user
    const abcakdoorUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'abcakdoor')
    });
    
    let keepUserId: number;
    let keepUsername: string;
    
    if (!abcakdoorUser) {
      console.log('❌ abcakdoor user not found, checking for admin user...');
      
      // Check if we have an admin user
      const adminUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, 'admin')
      });
      
      if (adminUser) {
        keepUserId = adminUser.id;
        keepUsername = adminUser.username;
        console.log(`✅ Found admin user: ${keepUsername} (ID: ${keepUserId})`);
      } else {
        console.log('❌ No admin or abcakdoor user found');
        return;
      }
    } else {
      keepUserId = abcakdoorUser.id;
      keepUsername = abcakdoorUser.username;
      console.log(`✅ Found abcakdoor user: ${keepUsername} (ID: ${keepUserId})`);
    }
    
    console.log('ℹ️  Updating foreign key references before cleanup...');
    
    // Update marketing workflows to reference the keeper user
    const updatedWorkflows = await db.update(marketingWorkflows)
      .set({ createdByUserId: keepUserId })
      .where(ne(marketingWorkflows.createdByUserId, keepUserId));
    console.log(`✅ Updated ${updatedWorkflows.rowCount} marketing workflows`);
    
    // Update channel members to reference the keeper user
    const updatedMembers = await db.update(channelMembers)
      .set({ userId: keepUserId })
      .where(ne(channelMembers.userId, keepUserId));
    console.log(`✅ Updated ${updatedMembers.rowCount} channel members`);
    
    // Update messages to reference the keeper user
    const updatedMessages = await db.update(messages)
      .set({ userId: keepUserId })
      .where(ne(messages.userId, keepUserId));
    console.log(`✅ Updated ${updatedMessages.rowCount} messages`);
    
    // Update leads to reference the keeper user
    const updatedLeads = await db.update(leads)
      .set({ assignedToUserId: keepUserId })
      .where(ne(leads.assignedToUserId, keepUserId));
    console.log(`✅ Updated ${updatedLeads.rowCount} leads`);
    
    // Update deals to reference the keeper user
    const updatedDeals = await db.update(deals)
      .set({ ownerUserId: keepUserId })
      .where(ne(deals.ownerUserId, keepUserId));
    console.log(`✅ Updated ${updatedDeals.rowCount} deals`);
    
    console.log('ℹ️  Deleting users except keeper user...');
    
    // Delete all users except the keeper
    const result = await db.delete(users).where(ne(users.id, keepUserId));
    console.log(`🗑️  Deleted ${result.rowCount} users, keeping ${keepUsername} user`);
    
    // Verify final state
    const remainingUsers = await db.query.users.findMany();
    console.log('✅ Final users in database:');
    remainingUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    console.log('🎉 Team member cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Team member cleanup failed:', error);
    throw error;
  }
}

cleanupTeamMembers()
  .then(() => {
    console.log('✅ Cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });