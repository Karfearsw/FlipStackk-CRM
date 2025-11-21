#!/usr/bin/env node

/**
 * Discord Bot Setup Script
 * 
 * This script sets up Discord slash commands for the CRM integration.
 * Run this after configuring your Discord application and bot.
 * 
 * Usage:
 *   npm run discord:setup
 * 
 * Required Environment Variables:
 *   DISCORD_APPLICATION_ID - Your Discord application ID
 *   DISCORD_BOT_TOKEN - Your Discord bot token
 *   DISCORD_PUBLIC_KEY - Your Discord application public key
 *   DISCORD_WEBHOOK_SECRET - Secret for webhook signature verification
 */

import { setupDiscordBot, validateDiscordEnv } from '../src/lib/discord/bot';

async function main() {
  console.log('🚀 Starting Discord bot setup...\n');
  
  // Validate environment
  const validation = validateDiscordEnv();
  if (!validation.valid) {
    console.error('❌ Missing required environment variables:');
    validation.missing.forEach(env => console.log(`   - ${env}`));
    console.log('\nPlease set these environment variables in your .env file:');
    console.log('DISCORD_APPLICATION_ID=your_application_id');
    console.log('DISCORD_BOT_TOKEN=your_bot_token');
    console.log('DISCORD_PUBLIC_KEY=your_public_key');
    console.log('DISCORD_WEBHOOK_SECRET=your_webhook_secret');
    process.exit(1);
  }
  
  console.log('✅ Environment variables configured');
  console.log('📋 Setting up Discord slash commands...\n');
  
  try {
    const success = await setupDiscordBot();
    
    if (success) {
      console.log('\n✅ Discord bot setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Configure your Discord application with the webhook URL:');
      console.log(`   ${process.env.NEXTAUTH_URL}/api/discord/webhook`);
      console.log('2. Set up channel-specific Discord mirroring in the Communication Hub');
      console.log('3. Test the integration by sending messages between Discord and CRM');
      console.log('\nAvailable commands in Discord:');
      console.log('/crm-lead <lead_id> - Get lead information');
      console.log('/crm-create-lead - Create a new lead');
      console.log('/crm-stats - Get CRM statistics');
      console.log('/crm-help - Show available commands');
    } else {
      console.error('\n❌ Discord bot setup failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error during setup:', error);
    process.exit(1);
  }
}

// Run setup
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});