// WhatsApp Business API Types

export interface WhatsAppConfig {
  phoneNumberId: string;
  businessAccountId: string;
  phoneNumber: string;
  displayName: string;
  verifiedName?: string;
  qualityRating?: 'GREEN' | 'YELLOW' | 'RED';
  webhookVerifyToken: string;
  accessToken: string;
  isActive: boolean;
  lastWebhookAt?: Date;
  appId?: string;
  appSecret?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WhatsAppContact {
  id: number;
  leadId: number;
  phoneNumber: string;
  waId?: string;
  profileName?: string;
  about?: string;
  profilePictureUrl?: string;
  isBlocked: boolean;
  lastMessageAt?: Date;
  messageCount: number;
  optInStatus: boolean;
  optInAt?: Date;
  optOutAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WhatsAppTemplate {
  id: number;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
  headerType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'LOCATION' | 'NONE';
  headerText?: string;
  headerExample?: string;
  bodyText: string;
  bodyExample?: string;
  footerText?: string;
  buttons?: WhatsAppButton[];
  templateId?: string;
  wabaId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WhatsAppButton {
  type: 'reply' | 'url' | 'call' | 'copy_code';
  text: string;
  url?: string;
  phoneNumber?: string;
  example?: string;
}

export interface WhatsAppMessage {
  id: number;
  communicationId: number;
  wamId?: string;
  phoneNumberId: string;
  contactId?: number;
  messageType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'template';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
  errorCode?: string;
  errorTitle?: string;
  errorDetails?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  isFromCustomer: boolean;
  replyToWamId?: string;
  contextMessageId?: string;
  pricingCategory?: string;
  pricingBillable: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// WhatsApp Business API Webhook Types
export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppValue;
  field: string;
}

export interface WhatsAppValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppContactInfo[];
  messages?: WhatsAppIncomingMessage[];
  statuses?: WhatsAppMessageStatus[];
}

export interface WhatsAppContactInfo {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    caption?: string;
    sha256: string;
  };
  document?: {
    id: string;
    filename: string;
    mime_type: string;
    caption?: string;
    sha256: string;
  };
  audio?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
  video?: {
    id: string;
    mime_type: string;
    caption?: string;
    sha256: string;
  };
  sticker?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: {
    addresses?: any[];
    birthday?: string;
    emails?: any[];
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
      middle_name?: string;
      suffix?: string;
      prefix?: string;
    };
    org?: {
      company?: string;
      department?: string;
      title?: string;
    };
    phones?: {
      phone?: string;
      wa_id?: string;
      type?: string;
    }[];
    urls?: any[];
  }[];
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  context?: {
    from: string;
    id: string;
  };
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive';
}

export interface WhatsAppMessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    category: 'business_initiated' | 'customer_initiated' | 'referral_conversion';
    expiration_timestamp?: string;
  };
  pricing?: {
    billable: boolean;
    category: string;
    pricing_model: string;
  };
  error?: {
    code: number;
    title: string;
    message?: string;
    error_data?: {
      details: string;
    };
  };
}

// WhatsApp Business API Request Types
export interface SendWhatsAppMessageRequest {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'template';
  text?: {
    body: string;
    preview_url?: boolean;
  };
  image?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  document?: {
    id?: string;
    link?: string;
    caption?: string;
    filename?: string;
  };
  audio?: {
    id?: string;
    link?: string;
  };
  video?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  sticker?: {
    id?: string;
    link?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: any[];
  interactive?: {
    type: 'button' | 'list' | 'product' | 'product_list';
    action: any;
    body?: {
      text: string;
    };
    footer?: {
      text: string;
    };
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      document?: {
        id?: string;
        filename?: string;
      };
      video?: {
        id?: string;
      };
      image?: {
        id?: string;
      };
    };
  };
  template?: {
    name: string;
    language: {
      code: string;
      policy?: string;
    };
    components?: any[];
  };
  context?: {
    message_id: string;
  };
}

export interface WhatsAppMediaUploadResponse {
  id: string;
  mime_type: string;
  sha256: string;
  file_size: number;
}

export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: {
    input: string;
    wa_id: string;
  }[];
  messages: {
    id: string;
  }[];
}

export interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      details: string;
    };
    fbtrace_id: string;
  };
}

export interface WhatsAppInteractiveMessage {
  type: 'button' | 'list' | 'product' | 'product_list';
  header?: {
    type: 'text' | 'video' | 'image' | 'document';
    text?: string;
    video?: { link: string };
    image?: { link: string };
    document?: { link: string; filename: string };
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: {
    buttons?: Array<{
      type: 'reply';
      reply: {
        id: string;
        title: string;
      };
    }>;
    button?: string;
    sections?: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
}

// WhatsApp Business API Template Types
export interface WhatsAppTemplateRequest {
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  components: WhatsAppTemplateComponent[];
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
  text?: string;
  example?: {
    header_text?: string[];
    header_handle?: string[];
    body_text?: string[][];
    footer_text?: string[];
  };
  buttons?: WhatsAppTemplateButton[];
}

export interface WhatsAppTemplateButton {
  type: 'url' | 'call' | 'copy_code' | 'quick_reply' | 'mpm' | 'catalog' | 'flow';
  text?: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

// WhatsApp Business API Business Profile Types
export interface WhatsAppBusinessProfile {
  about?: {
    text: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    country_code?: string;
    type?: string;
  };
  description?: {
    text: string;
  };
  email?: {
    email?: string;
  };
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
}

// WhatsApp Opt-in/Opt-out Types
export interface WhatsAppOptInRequest {
  phone_number: string;
  wa_id?: string;
}

export interface WhatsAppOptOutRequest {
  phone_number: string;
  wa_id?: string;
}

// WhatsApp Analytics Types
export interface WhatsAppAnalyticsRequest {
  start: number;
  end: number;
  granularity: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  phone_numbers?: string[];
  metric_types?: string[];
  conversation_directions?: string[];
  conversation_types?: string[];
  countries?: string[];
}

export interface WhatsAppAnalyticsResponse {
  data: WhatsAppAnalyticsData[];
}

export interface WhatsAppAnalyticsData {
  phone_number_id: string;
  granularity: string;
  data_points: WhatsAppDataPoint[];
}

export interface WhatsAppDataPoint {
  start: number;
  end: number;
  sent: number;
  delivered: number;
  read: number;
  conversations: {
    business_initiated: number;
    user_initiated: number;
    total: number;
  };
  cost: {
    total_cost: number;
    business_initiated: number;
    user_initiated: number;
  };
}