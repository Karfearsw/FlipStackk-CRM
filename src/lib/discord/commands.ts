// Discord slash commands configuration
export const DISCORD_COMMANDS = [
  {
    name: 'crm-lead',
    description: 'Get lead information from CRM',
    options: [
      {
        name: 'lead_id',
        description: 'The lead ID to look up',
        type: 4, // INTEGER
        required: true
      }
    ]
  },
  {
    name: 'crm-create-lead',
    description: 'Create a new lead in CRM',
    options: [
      {
        name: 'address',
        description: 'Property address',
        type: 3, // STRING
        required: true
      },
      {
        name: 'owner_name',
        description: 'Owner name',
        type: 3, // STRING
        required: true
      },
      {
        name: 'phone',
        description: 'Owner phone number',
        type: 3, // STRING
        required: false
      },
      {
        name: 'email',
        description: 'Owner email',
        type: 3, // STRING
        required: false
      }
    ]
  },
  {
    name: 'crm-stats',
    description: 'Get CRM statistics',
    options: []
  },
  {
    name: 'crm-help',
    description: 'Show available CRM commands',
    options: []
  }
];

// Discord API endpoints
export const DISCORD_API_BASE = 'https://discord.com/api/v10';

// Discord application commands endpoint
export function getApplicationCommandsEndpoint(applicationId: string) {
  return `${DISCORD_API_BASE}/applications/${applicationId}/commands`;
}

// Discord message components
export const LEAD_ACTION_ROW = {
  type: 1, // ACTION_ROW
  components: [
    {
      type: 2, // BUTTON
      style: 1, // PRIMARY
      label: 'Call Lead',
      custom_id: 'call_lead',
      emoji: {
        name: '📞'
      }
    },
    {
      type: 2, // BUTTON
      style: 2, // SECONDARY
      label: 'Send SMS',
      custom_id: 'send_sms',
      emoji: {
        name: '💬'
      }
    },
    {
      type: 2, // BUTTON
      style: 5, // LINK
      label: 'Open in CRM',
      url: '' // Will be populated with actual CRM URL
    }
  ]
};

// Discord embed colors
export const DISCORD_COLORS = {
  SUCCESS: 0x00ff00,
  ERROR: 0xff0000,
  WARNING: 0xffaa00,
  INFO: 0x0099ff,
  PRIMARY: 0x5865f2
};