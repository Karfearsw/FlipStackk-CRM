import { 
  WhatsAppConfig, 
  WhatsAppMessageResponse, 
  WhatsAppErrorResponse, 
  SendWhatsAppMessageRequest,
  WhatsAppMediaUploadResponse,
  WhatsAppTemplateRequest,
  WhatsAppBusinessProfile,
  WhatsAppAnalyticsRequest,
  WhatsAppAnalyticsResponse
} from './types';

export class WhatsAppClient {
  private baseUrl = 'https://graph.facebook.com/v18.0';
  private config: WhatsAppConfig;
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();
  private maxRequestsPerMinute = 60; // WhatsApp Business API limit

  constructor(config: WhatsAppConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    const requiredFields = ['phoneNumberId', 'businessAccountId', 'phoneNumber', 'accessToken', 'webhookVerifyToken'];
    const missingFields = requiredFields.filter(field => !this.config[field as keyof WhatsAppConfig]);
    
    if (missingFields.length > 0) {
      throw new Error(`WhatsAppClient configuration invalid. Missing fields: ${missingFields.join(', ')}`);
    }
  }

  private checkRateLimit(endpoint: string): boolean {
    const now = Date.now();
    const key = `${this.config.phoneNumberId}:${endpoint}`;
    const limitData = this.rateLimiter.get(key);
    
    if (!limitData || now > limitData.resetTime) {
      // Reset counter for new minute
      this.rateLimiter.set(key, {
        count: 1,
        resetTime: now + 60000 // 1 minute from now
      });
      return true;
    }
    
    if (limitData.count >= this.maxRequestsPerMinute) {
      console.warn(`⚠️ Rate limit exceeded for ${endpoint}. Requests: ${limitData.count}/${this.maxRequestsPerMinute}`);
      return false;
    }
    
    limitData.count++;
    return true;
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a rate limit error (429) or server error (5xx)
        if (error instanceof Error && error.message.includes('429')) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`⏱️ Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors, don't retry
        throw error;
      }
    }
    
    throw lastError!;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // Check rate limit
    if (!this.checkRateLimit(endpoint)) {
      throw new Error('Rate limit exceeded');
    }

    return this.retryWithBackoff(async () => {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json() as WhatsAppErrorResponse;
        
        // Check for rate limiting (429) or server errors (5xx)
        if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
          // These errors should trigger retry
          throw new Error(`429: Rate limited or server error: ${response.status}`);
        }
        
        // For other errors, don't retry
        throw new Error(`WhatsApp API Error: ${errorData.error.message} (${errorData.error.code})`);
      }

      return response.json() as Promise<T>;
    });
  }

  // Message sending methods
  async sendTextMessage(to: string, text: string, previewUrl = false): Promise<WhatsAppMessageResponse> {
    const request: SendWhatsAppMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        body: text,
        preview_url: previewUrl,
      },
    };

    return this.makeRequest<WhatsAppMessageResponse>(
      `/${this.config.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    languageCode = 'en_US',
    components: any[] = []
  ): Promise<WhatsAppMessageResponse> {
    const request: SendWhatsAppMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components,
      },
    };

    return this.makeRequest<WhatsAppMessageResponse>(
      `/${this.config.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppMessageResponse> {
    const request: SendWhatsAppMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption,
      },
    };

    return this.makeRequest<WhatsAppMessageResponse>(
      `/${this.config.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async getBusinessAccountInfo(): Promise<WhatsAppBusinessProfile> {
    return this.makeRequest<WhatsAppBusinessProfile>(
      `/${this.config.businessAccountId}`,
      {
        method: 'GET',
      }
    );
  }

  async sendDocumentMessage(to: string, documentUrl: string, filename: string, caption?: string): Promise<WhatsAppMessageResponse> {
    const request: SendWhatsAppMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption,
      },
    };

    return this.makeRequest<WhatsAppMessageResponse>(
      `/${this.config.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async sendLocationMessage(
    to: string, 
    latitude: number, 
    longitude: number, 
    name?: string, 
    address?: string
  ): Promise<WhatsAppMessageResponse> {
    const request: SendWhatsAppMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'location',
      location: {
        latitude,
        longitude,
        name,
        address,
      },
    };

    return this.makeRequest<WhatsAppMessageResponse>(
      `/${this.config.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async sendInteractiveMessage(
    to: string,
    interactive: {
      type: 'button' | 'list' | 'product' | 'product_list';
      action: any;
      body?: { text: string };
      footer?: { text: string };
      header?: { type: 'text' | 'image' | 'video' | 'document'; text?: string };
    }
  ): Promise<WhatsAppMessageResponse> {
    const request: SendWhatsAppMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive,
    };

    return this.makeRequest<WhatsAppMessageResponse>(
      `/${this.config.phoneNumberId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Media upload methods
  async uploadMedia(file: Buffer, mimeType: string): Promise<WhatsAppMediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(file)], { type: mimeType }), 'file');
    formData.append('messaging_product', 'whatsapp');

    const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json() as WhatsAppErrorResponse;
      throw new Error(`WhatsApp Media Upload Error: ${errorData.error.message} (${errorData.error.code})`);
    }

    return response.json() as Promise<WhatsAppMediaUploadResponse>;
  }

  async getMediaUrl(mediaId: string): Promise<{ url: string; mime_type: string; sha256: string; file_size: number }> {
    return this.makeRequest<{ url: string; mime_type: string; sha256: string; file_size: number }>(
      `/${mediaId}/`
    );
  }

  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  // Template management methods
  async createTemplate(template: WhatsAppTemplateRequest): Promise<any> {
    return this.makeRequest(
      `/${this.config.businessAccountId}/message_templates`,
      {
        method: 'POST',
        body: JSON.stringify(template),
      }
    );
  }

  async getTemplates(): Promise<any> {
    return this.makeRequest(
      `/${this.config.businessAccountId}/message_templates`
    );
  }

  async deleteTemplate(name: string): Promise<any> {
    return this.makeRequest(
      `/${this.config.businessAccountId}/message_templates/${name}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Business profile methods
  async getBusinessProfile(): Promise<WhatsAppBusinessProfile> {
    return this.makeRequest<WhatsAppBusinessProfile>(
      `/${this.config.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`
    );
  }

  async updateBusinessProfile(profile: Partial<WhatsAppBusinessProfile>): Promise<any> {
    return this.makeRequest(
      `/${this.config.phoneNumberId}/whatsapp_business_profile`,
      {
        method: 'POST',
        body: JSON.stringify(profile),
      }
    );
  }

  // Analytics methods
  async getAnalytics(request: WhatsAppAnalyticsRequest): Promise<WhatsAppAnalyticsResponse> {
    const params = new URLSearchParams();
    Object.entries(request).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.append(key, String(value));
      }
    });

    return this.makeRequest<WhatsAppAnalyticsResponse>(
      `/${this.config.businessAccountId}/analytics?${params.toString()}`
    );
  }

  // Phone number info
  async getPhoneNumberInfo(): Promise<any> {
    return this.makeRequest(
      `/${this.config.phoneNumberId}/?fields=display_phone_number,verified_name,quality_rating,code_verification_status`
    );
  }

  // Contact management methods
  async getBusinessProfileContacts(): Promise<Array<{
    phone: string;
    name: string;
    about?: string;
    tags?: string[];
  }>> {
    // This is a mock implementation - in production, you'd integrate with WhatsApp Business API
    // For now, return sample data that matches the expected format
    return [
      {
        phone: '+1234567890',
        name: 'John Doe',
        about: 'Property seller',
        tags: ['lead', 'seller']
      },
      {
        phone: '+1987654321',
        name: 'Jane Smith',
        about: 'Interested in selling',
        tags: ['prospect', 'interested']
      }
    ];
  }

  async addContact(contact: {
    phone: string;
    name: string;
    about?: string;
    tags?: string[];
  }): Promise<any> {
    // Mock implementation - in production, this would add to WhatsApp Business contacts
    console.log('Adding WhatsApp contact:', contact);
    return { success: true, contact };
  }

  async getMessageTemplates(): Promise<any> {
    return this.makeRequest(
      `/${this.config.businessAccountId}/message_templates`
    );
  }

  async createMessageTemplate(template: WhatsAppTemplateRequest): Promise<any> {
    return this.makeRequest(
      `/${this.config.businessAccountId}/message_templates`,
      {
        method: 'POST',
        body: JSON.stringify(template),
      }
    );
  }

  // Webhook verification
  verifyWebhook(mode: string, token: string, challenge: string): string | false {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge;
    }
    return false;
  }

  // Utility methods
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming US)
    if (cleaned.length === 10) {
      return `1${cleaned}`;
    }
    
    return cleaned;
  }

  isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}