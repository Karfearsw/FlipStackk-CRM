# Discord Integration Guide

This guide explains how to set up and use the Discord integration for the CRM system.

## Overview

The Discord integration allows bidirectional communication between your CRM and Discord channels:
- **Outbound**: CRM messages are automatically mirrored to Discord channels
- **Inbound**: Discord messages are received and stored in the CRM
- **Slash Commands**: Use Discord commands to interact with the CRM

## Features

### ✅ Completed Features
- **Per-channel Discord mirroring controls**
- **Outbound message mirroring** (CRM → Discord)
- **Inbound message handling** (Discord → CRM)
- **Discord webhook endpoint** with signature verification
- **Slash commands framework**
- **Communication logging** for audit trail

### 🔄 Next Steps (Phase 2 Continuation)
- Enhanced slash commands with lead management
- Discord role-based permissions
- File attachment support
- Discord bot presence and status

## Setup Instructions

### 1. Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "CRM Bot")
3. Go to the "Bot" section and click "Add Bot"
4. Copy the following credentials:
   - **Application ID** (from General Information)
   - **Bot Token** (from Bot section)
   - **Public Key** (from General Information)

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Discord Bot Configuration
DISCORD_APPLICATION_ID=your_application_id_here
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_PUBLIC_KEY=your_public_key_here
DISCORD_WEBHOOK_SECRET=your_webhook_secret_here  # Generate a random string

# Optional: Default webhook URL for channels without specific configuration
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_here
```

### 3. Register Slash Commands

Run the setup script to register Discord slash commands:

```bash
npm run discord:setup
```

This will register the following commands:
- `/crm-lead <lead_id>` - Get lead information
- `/crm-create-lead` - Create a new lead
- `/crm-stats` - Get CRM statistics
- `/crm-help` - Show available commands

### 4. Configure Discord Channels

#### For Outbound Mirroring (CRM → Discord)
1. In Discord, go to the channel you want to mirror to
2. Click channel settings → Integrations → Webhooks
3. Create a new webhook and copy the webhook URL
4. In the CRM Communication Hub, when creating a channel:
   - Enable "Discord Mirroring"
   - Paste the webhook URL
   - Optionally add the Discord Channel ID

#### For Inbound Messages (Discord → CRM)
1. In your Discord application settings, go to "General Information"
2. Add this webhook URL: `https://your-domain.com/api/discord/webhook`
3. Ensure your bot has the necessary permissions in the channel

### 5. Channel Configuration

When creating a channel in the Communication Hub, you can now configure:

- **Discord Webhook URL**: The webhook for outbound messages
- **Discord Channel ID**: The specific Discord channel ID (optional)
- **Discord Mirroring**: Toggle to enable/disable mirroring

## Usage Examples

### Outbound Mirroring
1. Create a channel with Discord mirroring enabled
2. Send a message in the CRM
3. The message appears in Discord with format: `[Channel Name] User Name: Message content`

### Inbound Messages
1. Users type messages in the Discord channel
2. Messages appear in the CRM with format: `[Discord] Username#1234: Message content`
3. Messages are logged as communications for audit purposes

### Slash Commands
Type in Discord:
```
/crm-lead 123
```
This would fetch information about lead ID 123 from your CRM.

## API Endpoints

### Discord Webhook
- **POST** `/api/discord/webhook` - Receives Discord messages and interactions
- **PUT** `/api/discord/webhook` - Handles Discord interactions and slash commands

### Discord Setup
- **GET** `/api/discord/setup` - Check Discord configuration status
- **POST** `/api/discord/setup` - Register slash commands (admin only)

## Security Features

- **Webhook Signature Verification**: All incoming Discord webhooks are verified
- **Admin-only Setup**: Discord configuration requires admin privileges
- **Environment-based Configuration**: Sensitive data stored in environment variables
- **Audit Logging**: All Discord communications are logged in the CRM

## Troubleshooting

### Common Issues

1. **Messages not appearing in Discord**
   - Check webhook URL is correct
   - Verify Discord mirroring is enabled for the channel
   - Check environment variables are set

2. **Discord messages not appearing in CRM**
   - Verify webhook URL is configured in Discord app
   - Check that channel has matching Discord Channel ID
   - Review server logs for webhook errors

3. **Slash commands not working**
   - Run `npm run discord:setup` to register commands
   - Verify bot has necessary permissions
   - Check Discord application configuration

### Logs
Check your server logs for Discord-related errors. Common log messages:
- "Discord webhook not configured" - Missing environment variables
- "Invalid signature" - Webhook security issue
- "No matching CRM channel" - Channel configuration issue

## Configuration Reference

### Environment Variables
```bash
DISCORD_APPLICATION_ID     # Discord application ID
DISCORD_BOT_TOKEN        # Discord bot token
DISCORD_PUBLIC_KEY       # Discord application public key
DISCORD_WEBHOOK_SECRET   # Secret for webhook verification
DISCORD_WEBHOOK_URL      # Optional default webhook URL
```

### Channel Fields
```typescript
interface Channel {
  discordWebhookUrl?: string;      // Discord webhook URL
  discordChannelId?: string;       // Discord channel ID
  discordMirroringEnabled: boolean; // Enable/disable mirroring
}
```

## Next Steps

The Discord integration is now functional with core features. Future enhancements could include:
- Rich embed support for better message formatting
- File attachment handling
- Discord role-based permissions
- Advanced slash commands for lead management
- Discord bot dashboard for easier configuration

For support or feature requests, please refer to the project documentation.