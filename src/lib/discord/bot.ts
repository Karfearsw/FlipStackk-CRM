import { DISCORD_COMMANDS, getApplicationCommandsEndpoint, DISCORD_API_BASE } from './commands';

interface DiscordBotConfig {
  applicationId: string;
  botToken: string;
  publicKey: string;
  webhookSecret: string;
}

// Register slash commands with Discord
export async function registerDiscordCommands(config: DiscordBotConfig) {
  const endpoint = getApplicationCommandsEndpoint(config.applicationId);
  
  for (const command of DISCORD_COMMANDS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${config.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });
      
      if (response.ok) {
        console.log(`✅ Registered command: ${command.name}`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to register ${command.name}:`, error);
      }
    } catch (error) {
      console.error(`❌ Error registering ${command.name}:`, error);
    }
  }
}

// Delete all existing commands (useful for cleanup)
export async function deleteAllCommands(config: DiscordBotConfig) {
  const endpoint = getApplicationCommandsEndpoint(config.applicationId);
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${config.botToken}`,
      },
    });
    
    if (response.ok) {
      const commands = await response.json();
      
      for (const command of commands) {
        const deleteResponse = await fetch(`${endpoint}/${command.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bot ${config.botToken}`,
          },
        });
        
        if (deleteResponse.ok) {
          console.log(`🗑️ Deleted command: ${command.name}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error deleting commands:', error);
  }
}

// Verify Discord webhook signature
export function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string,
  publicKey: string
): boolean {
  try {
    const crypto = require('crypto');
    const message = timestamp + body;
    
    // Create a hash-based message authentication code (HMAC) using the public key
    const hmac = crypto.createHmac('sha256', publicKey);
    hmac.update(message);
    const digest = hmac.digest('hex');
    
    return signature === digest;
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return false;
  }
}

// Create Discord webhook URL for a channel
export function createDiscordWebhook(channelId: string, token: string) {
  return `${DISCORD_API_BASE}/webhooks/${channelId}/${token}`;
}

// Send message to Discord channel
export async function sendDiscordMessage(webhookUrl: string, content: string, options: any = {}) {
  try {
    const payload = {
      content,
      ...options
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord API error: ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to send Discord message:', error);
    throw error;
  }
}

// Get bot information
export async function getBotInfo(token: string) {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to get bot info:', error);
    throw error;
  }
}

// Environment validation
export function validateDiscordEnv(): { valid: boolean; missing: string[] } {
  const required = [
    'DISCORD_APPLICATION_ID',
    'DISCORD_BOT_TOKEN',
    'DISCORD_PUBLIC_KEY',
    'DISCORD_WEBHOOK_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Bot setup script
export async function setupDiscordBot() {
  const validation = validateDiscordEnv();
  
  if (!validation.valid) {
    console.error('❌ Missing Discord environment variables:', validation.missing);
    return false;
  }
  
  const config: DiscordBotConfig = {
    applicationId: process.env.DISCORD_APPLICATION_ID!,
    botToken: process.env.DISCORD_BOT_TOKEN!,
    publicKey: process.env.DISCORD_PUBLIC_KEY!,
    webhookSecret: process.env.DISCORD_WEBHOOK_SECRET!
  };
  
  try {
    // Get bot info
    const botInfo = await getBotInfo(config.botToken);
    console.log(`🤖 Discord Bot: ${botInfo.username}#${botInfo.discriminator}`);
    
    // Register commands
    console.log('📋 Registering slash commands...');
    await registerDiscordCommands(config);
    
    console.log('✅ Discord bot setup complete!');
    return true;
  } catch (error) {
    console.error('❌ Discord bot setup failed:', error);
    return false;
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDiscordBot().then(success => {
    process.exit(success ? 0 : 1);
  });
}