import { 
  WhatsAppTemplateRequest, 
  WhatsAppTemplateComponent, 
  WhatsAppTemplateButton,
  WhatsAppBusinessProfile,
  SendWhatsAppMessageRequest,
  WhatsAppInteractiveMessage
} from './types';

export class WhatsAppCompliance {
  private static readonly OPT_IN_REQUIRED = true;
  private static readonly BUSINESS_INITIATED_WINDOW_HOURS = 24;
  private static readonly CUSTOMER_INITIATED_WINDOW_HOURS = 24;

  // Phone number formatting and validation
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming US)
    if (cleaned.length === 10) {
      return `1${cleaned}`;
    }
    
    return cleaned;
  }

  static validatePhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  static isValidWhatsAppNumber(phoneNumber: string): boolean {
    // Basic validation - WhatsApp supports international numbers
    const formatted = this.formatPhoneNumber(phoneNumber);
    return this.validatePhoneNumber(formatted);
  }

  // Opt-in/opt-out management
  static hasOptIn(phoneNumber: string): boolean {
    // This would typically check database for opt-in status
    // For now, return true to allow testing
    // In production, implement proper opt-in tracking
    return true;
  }

  static async recordOptIn(phoneNumber: string, method: 'web_form' | 'sms' | 'verbal' | 'written'): Promise<void> {
    // Record opt-in with timestamp and method
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    console.log(`📱 WhatsApp opt-in recorded for ${formattedPhone} via ${method}`);
    
    // In production, store in database with:
    // - phone number
    // - opt-in timestamp
    // - opt-in method
    // - IP address (if web)
    // - user agent (if web)
  }

  static async recordOptOut(phoneNumber: string, method: 'sms' | 'web_form' | 'verbal' | 'api'): Promise<void> {
    // Record opt-out with timestamp and method
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    console.log(`📱 WhatsApp opt-out recorded for ${formattedPhone} via ${method}`);
    
    // In production, update database with opt-out info
  }

  // Message window management
  static isWithinCustomerServiceWindow(lastCustomerMessageTime: Date): boolean {
    const now = new Date();
    const hoursSinceLastMessage = (now.getTime() - lastCustomerMessageTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastMessage <= this.CUSTOMER_INITIATED_WINDOW_HOURS;
  }

  static canSendBusinessInitiatedMessage(lastCustomerMessageTime?: Date): boolean {
    if (!lastCustomerMessageTime) {
      // No previous conversation - can only send with template
      return false;
    }

    return this.isWithinCustomerServiceWindow(lastCustomerMessageTime);
  }

  // Template message validation
  static validateTemplateMessage(templateName: string, category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'): boolean {
    // Check if template exists and is approved
    // In production, query WhatsApp Business API
    const approvedTemplates = [
      'lead_followup',
      'property_evaluation',
      'appointment_confirmation',
      'offer_presentation',
      'document_request',
      'closing_reminder',
      'welcome_message'
    ];

    return approvedTemplates.includes(templateName);
  }

  // Message content validation
  static validateMessageContent(content: string): { valid: boolean; reason?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, reason: 'Message content cannot be empty' };
    }

    if (content.length > 4096) {
      return { valid: false, reason: 'Message content exceeds 4096 character limit' };
    }

    // Check for prohibited content
    const prohibitedPatterns = [
      /\b(buy now|click here|limited time)\b/gi,
      /\b(make money fast|get rich)\b/gi,
      /\b(pharmacy|viagra|cialis)\b/gi,
      /\b(casino|gambling|bet)\b/gi
    ];

    for (const pattern of prohibitedPatterns) {
      if (pattern.test(content)) {
        return { valid: false, reason: 'Message contains prohibited content' };
      }
    }

    return { valid: true };
  }

  // Rate limiting
  static checkRateLimit(phoneNumber: string, messageCount: number): boolean {
    // WhatsApp Business API rate limits:
    // - 1000 messages per second per business account
    // - 80 messages per second per phone number
    // - Business-initiated: 250 messages per rolling 24h per user
    
    // Simple implementation - in production use Redis or similar
    const maxMessagesPer24h = 250;
    return messageCount < maxMessagesPer24h;
  }

  // Privacy and data handling
  static anonymizePhoneNumber(phoneNumber: string): string {
    const formatted = this.formatPhoneNumber(phoneNumber);
    if (formatted.length < 4) return formatted;
    
    // Show last 4 digits only
    return `***${formatted.slice(-4)}`;
  }

  static getDataRetentionPolicy(): string {
    return `
      WhatsApp Message Data Retention Policy:
      - Message content: 1 year
      - Message metadata: 2 years  
      - Opt-in/out records: 7 years
      - Analytics data: 3 years
      - Media files: 6 months
    `;
  }
}

export class WhatsAppMessageBuilder {
  // Build common CRM message templates
  static buildLeadFollowUp(leadName: string, propertyAddress: string, agentName: string): WhatsAppTemplateRequest {
    return {
      name: 'lead_followup',
      category: 'UTILITY',
      language: 'en_US',
      components: [
        {
          type: 'header',
          format: 'TEXT',
          text: 'Property Follow-up'
        },
        {
          type: 'body',
          text: `Hi {{1}}, I hope you're doing well! This is {{2}} from FlipStackk CRM. I wanted to follow up on your property at {{3}}. Do you have any questions or would you like to discuss next steps?`,
          example: {
            body_text: [[leadName, agentName, propertyAddress]]
          }
        },
        {
          type: 'footer',
          text: 'Reply STOP to opt out'
        },
        {
          type: 'buttons',
          buttons: [
            {
              type: 'quick_reply',
              text: 'Get Offer'
            },
            {
              type: 'quick_reply', 
              text: 'Schedule Call'
            },
            {
              type: 'quick_reply',
              text: 'Not Interested'
            }
          ]
        }
      ]
    };
  }

  static buildPropertyEvaluation(leadName: string, propertyAddress: string, companyName: string): WhatsAppTemplateRequest {
    return {
      name: 'property_evaluation',
      category: 'UTILITY',
      language: 'en_US',
      components: [
        {
          type: 'header',
          format: 'TEXT',
          text: 'Property Evaluation Ready'
        },
        {
          type: 'body',
          text: `Hi {{1}}, your property evaluation for {{2}} is complete! {{3}} has prepared a comprehensive analysis. Would you like to review the results?`,
          example: {
            body_text: [[leadName, propertyAddress, companyName]]
          }
        },
        {
          type: 'footer',
          text: 'Professional property services'
        }
      ]
    };
  }

  static buildAppointmentConfirmation(
    leadName: string, 
    date: string, 
    time: string, 
    propertyAddress: string
  ): WhatsAppTemplateRequest {
    return {
      name: 'appointment_confirmation',
      category: 'UTILITY',
      language: 'en_US',
      components: [
        {
          type: 'header',
          format: 'TEXT',
          text: 'Appointment Confirmed'
        },
        {
          type: 'body',
          text: `Hi {{1}}, your appointment is confirmed for {{2}} at {{3}} to discuss {{4}}. Please let us know if you need to reschedule.`,
          example: {
            body_text: [[leadName, date, time, propertyAddress]]
          }
        },
        {
          type: 'footer',
          text: 'Looking forward to meeting you'
        }
      ]
    };
  }

  static buildOfferPresentation(
    offerAmount: string, 
    leadName: string, 
    propertyAddress: string, 
    closingTimeline: string
  ): WhatsAppTemplateRequest {
    return {
      name: 'offer_presentation',
      category: 'UTILITY',
      language: 'en_US',
      components: [
        {
          type: 'header',
          format: 'TEXT',
          text: 'Purchase Offer'
        },
        {
          type: 'body',
          text: `Hi {{1}}, we're pleased to present an offer of {{2}} for your property at {{3}}. We can close in {{4}}. Would you like to discuss this offer?`,
          example: {
            body_text: [[leadName, offerAmount, propertyAddress, closingTimeline]]
          }
        },
        {
          type: 'footer',
          text: 'No obligation consultation'
        }
      ]
    };
  }

  // Build interactive messages
  static buildInteractiveButtons(
    body: string,
    buttons: Array<{ id: string; title: string }>,
    header?: string,
    footer?: string
  ): SendWhatsAppMessageRequest {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '', // Will be filled by caller
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.map(button => ({
            type: 'reply',
            reply: {
              id: button.id,
              title: button.title
            }
          }))
        },
        ...(header && { header: { type: 'text', text: header } }),
        ...(footer && { footer: { text: footer } })
      }
    };
  }

  static buildInteractiveList(
    body: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>
    }>,
    header?: string,
    footer?: string
  ): SendWhatsAppMessageRequest {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '', // Will be filled by caller
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: body },
        action: {
          button: buttonText,
          sections: sections.map(section => ({
            title: section.title,
            rows: section.rows.map(row => ({
              id: row.id,
              title: row.title,
              ...(row.description && { description: row.description })
            }))
          }))
        },
        ...(header && { header: { type: 'text', text: header } }),
        ...(footer && { footer: { text: footer } })
      }
    };
  }

  // Build location message
  static buildLocationMessage(
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): SendWhatsAppMessageRequest {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '', // Will be filled by caller
      type: 'location',
      location: {
        latitude,
        longitude,
        name,
        address
      }
    };
  }
}

// Quick reply handlers for common CRM interactions
export class WhatsAppQuickReplyHandler {
  static handlePropertyInterest(leadId: string, interestLevel: 'high' | 'medium' | 'low'): string {
    const responses = {
      high: "Great! I'm very interested in learning more about your property buying services.",
      medium: "I'm somewhat interested. Can you tell me more about how this works?",
      low: "I'm just gathering information right now, thanks."
    };

    return responses[interestLevel];
  }

  static handleTimelineResponse(leadId: string, timeline: 'asap' | '1-3months' | '3-6months' | '6+months'): string {
    const responses = {
      asap: "I need to sell as soon as possible.",
      '1-3months': "I'm looking to sell within the next 1-3 months.",
      '3-6months': "I'm planning to sell in 3-6 months.",
      '6+months': "I'm just exploring options for 6+ months from now."
    };

    return responses[timeline];
  }

  static handleConditionResponse(leadId: string, condition: 'excellent' | 'good' | 'fair' | 'poor'): string {
    const responses = {
      excellent: "My property is in excellent condition with no repairs needed.",
      good: "My property is in good condition with minor updates needed.",
      fair: "My property needs some work but is structurally sound.",
      poor: "My property needs significant repairs and updates."
    };

    return responses[condition];
  }
}