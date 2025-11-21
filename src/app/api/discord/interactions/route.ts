import { NextRequest } from 'next/server';
import { verifyKey } from 'discord-interactions';
import { messagingStorage } from '@/lib/storage';
import { db } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { channels, messages, users, leads } from '@/db/schema';

export const runtime = 'nodejs';

// Discord interaction types
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
};

const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
};

// Discord slash commands
const commands = {
  CRM_LEAD: 'crm-lead',
  CRM_CREATE_LEAD: 'crm-create-lead',
  CRM_STATS: 'crm-stats',
  CRM_HELP: 'crm-help',
};

async function getUserByDiscordId(discordId: string): Promise<any[]> {
  // For now, return empty since we don't have discordId in users table
  // This can be enhanced later when Discord OAuth is implemented
  return [];
}

async function getChannelByDiscordId(discordChannelId: string) {
  return await db.select()
    .from(channels)
    .where(and(
      eq(channels.discordChannelId, discordChannelId),
      eq(channels.discordMirroringEnabled, true)
    ))
    .limit(1);
}

async function handleLeadCommand(interaction: any) {
  const leadId = interaction.data.options?.find((opt: any) => opt.name === 'lead_id')?.value;
  
  if (!leadId) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ Please provide a lead ID. Usage: `/crm-lead <lead_id>`',
        flags: 64, // Ephemeral
      },
    };
  }

  try {
    const lead = await db.select({
      id: leads.id,
      name: leads.ownerName,
      email: leads.ownerEmail,
      phone: leads.ownerPhone,
      status: leads.status,
      source: leads.source,
      assignedTo: leads.assignedToUserId,
      createdAt: leads.createdAt,
      notes: leads.notes,
    })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (lead.length === 0) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ Lead with ID \`${leadId}\` not found.`,
          flags: 64, // Ephemeral
        },
      };
    }

    const leadData = lead[0];
    const embed = {
      title: `📋 Lead Details: ${leadData.name}`,
      description: leadData.notes || 'No notes available',
      color: 0x0099ff,
      fields: [
        {
          name: '🆔 ID',
          value: leadData.id,
          inline: true,
        },
        {
          name: '📧 Email',
          value: leadData.email || 'Not provided',
          inline: true,
        },
        {
          name: '📞 Phone',
          value: leadData.phone || 'Not provided',
          inline: true,
        },
        {
          name: '📊 Status',
          value: leadData.status,
          inline: true,
        },
        {
          name: '🎯 Source',
          value: leadData.source || 'Unknown',
          inline: true,
        },
        {
          name: '👤 Assigned To',
          value: leadData.assignedTo || 'Unassigned',
          inline: true,
        },
        {
          name: '📅 Created',
          value: new Date(leadData.createdAt).toLocaleDateString(),
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [embed],
      },
    };
  } catch (error) {
    console.error('Error fetching lead:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ An error occurred while fetching the lead. Please try again later.',
        flags: 64, // Ephemeral
      },
    };
  }
}

async function handleCreateLeadCommand(interaction: any) {
  const name = interaction.data.options?.find((opt: any) => opt.name === 'name')?.value;
  const email = interaction.data.options?.find((opt: any) => opt.name === 'email')?.value;
  const phone = interaction.data.options?.find((opt: any) => opt.name === 'phone')?.value;
  const source = interaction.data.options?.find((opt: any) => opt.name === 'source')?.value || 'Discord';
  const notes = interaction.data.options?.find((opt: any) => opt.name === 'notes')?.value;

  if (!name) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ Name is required. Usage: `/crm-create-lead name:<name> email:<email> phone:<phone>`',
        flags: 64, // Ephemeral
      },
    };
  }

  try {
    // Get the Discord user who created the lead
    const discordUser = await getUserByDiscordId(interaction.member.user.id);
    const assignedTo = discordUser.length > 0 ? discordUser[0].id : null;

    // Create the lead
    const newLead = await db.insert(leads)
      .values({
        leadId: `discord-${Date.now()}`,
        propertyAddress: 'TBD',
        city: 'TBD',
        state: 'TBD',
        zip: '00000',
        ownerName: name,
        ownerEmail: email || null,
        ownerPhone: phone || null,
        source,
        status: 'new',
        assignedToUserId: assignedTo,
        notes: notes || `Created from Discord by ${interaction.member.user.username}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const embed = {
      title: '✅ Lead Created Successfully',
      description: `New lead "${name}" has been created in the CRM.`,
      color: 0x00ff00,
      fields: [
        {
          name: '🆔 ID',
          value: newLead[0].id,
          inline: true,
        },
        {
          name: '📧 Email',
          value: email || 'Not provided',
          inline: true,
        },
        {
          name: '📞 Phone',
          value: phone || 'Not provided',
          inline: true,
        },
        {
          name: '🎯 Source',
          value: source,
          inline: true,
        },
        {
          name: '👤 Assigned To',
          value: assignedTo ? interaction.member.user.username : 'Unassigned',
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [embed],
      },
    };
  } catch (error) {
    console.error('Error creating lead:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ An error occurred while creating the lead. Please try again later.',
        flags: 64, // Ephemeral
      },
    };
  }
}

async function handleStatsCommand(interaction: any) {
  try {
    // Get basic CRM statistics
    const totalLeads = await db.select({ count: sql<number>`count(*)` })
      .from(leads);
    
    const newLeads = await db.select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.status, 'new'));
    
    const convertedLeads = await db.select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.status, 'converted'));

    const totalMessages = await db.select({ count: sql<number>`count(*)` })
      .from(messages);

    const embed = {
      title: '📊 CRM Statistics',
      description: 'Current system overview',
      color: 0x0099ff,
      fields: [
        {
          name: '📈 Total Leads',
          value: totalLeads[0].count.toString(),
          inline: true,
        },
        {
          name: '🆕 New Leads',
          value: newLeads[0].count.toString(),
          inline: true,
        },
        {
          name: '✅ Converted Leads',
          value: convertedLeads[0].count.toString(),
          inline: true,
        },
        {
          name: '💬 Total Messages',
          value: totalMessages[0].count.toString(),
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [embed],
      },
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ An error occurred while fetching statistics. Please try again later.',
        flags: 64, // Ephemeral
      },
    };
  }
}

async function handleHelpCommand() {
  const embed = {
    title: '🤖 CRM Bot Commands',
    description: 'Available commands for interacting with the CRM system',
    color: 0x0099ff,
    fields: [
      {
        name: '/crm-lead <lead_id>',
        value: 'Get detailed information about a specific lead',
        inline: false,
      },
      {
        name: '/crm-create-lead name:<name> email:<email> phone:<phone>',
        value: 'Create a new lead in the CRM system',
        inline: false,
      },
      {
        name: '/crm-stats',
        value: 'Get current CRM statistics and overview',
        inline: false,
      },
      {
        name: '/crm-help',
        value: 'Show this help message',
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();

    if (!signature || !timestamp) {
      return new Response('Missing signature headers', { status: 401 });
    }

    // Verify Discord signature
    const isValid = verifyKey(body, signature, timestamp, process.env.DISCORD_PUBLIC_KEY!);
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const interaction = JSON.parse(body);

    // Handle ping (used for webhook verification)
    if (interaction.type === InteractionType.PING) {
      return Response.json({ type: InteractionResponseType.PONG });
    }

    // Handle application commands
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const { name } = interaction.data;

      switch (name) {
        case commands.CRM_LEAD:
          return Response.json(await handleLeadCommand(interaction));
        
        case commands.CRM_CREATE_LEAD:
          return Response.json(await handleCreateLeadCommand(interaction));
        
        case commands.CRM_STATS:
          return Response.json(await handleStatsCommand(interaction));
        
        case commands.CRM_HELP:
          return Response.json(await handleHelpCommand());
        
        default:
          return Response.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `❌ Unknown command: ${name}`,
              flags: 64, // Ephemeral
            },
          });
      }
    }

    return new Response('Unknown interaction type', { status: 400 });
  } catch (error) {
    console.error('Discord interaction error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}