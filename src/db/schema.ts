import { pgTable, text, serial, integer, timestamp, boolean, numeric, date, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password"),
    name: text("name"),
    role: text("role", { enum: ["admin", "acquisitions", "caller", "investor"] }).default("caller"),
    authProvider: text("auth_provider", { enum: ["credentials", "linkedin", "facebook"] }).default("credentials"),
    providerAccountId: text("provider_account_id"),
    active: boolean("active").default(true),
    deactivatedAt: timestamp("deactivated_at"),
    oauthEmailVerifiedAt: timestamp("oauth_email_verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => ({
    usersProviderAccountUnique: uniqueIndex("users_provider_account_unique").on(
      table.authProvider,
      table.providerAccountId
    ),
  })
);

export const insertUserSchema = createInsertSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const archivedUsers = pgTable("archived_users", {
  id: serial("id").primaryKey(),
  sourceUserId: integer("source_user_id").notNull(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role", { enum: ["admin", "acquisitions", "caller", "investor"] }).default("caller"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
  archivedAt: timestamp("archived_at").defaultNow().notNull(),
});

export const insertArchivedUserSchema = createInsertSchema(archivedUsers);
export type ArchivedUser = typeof archivedUsers.$inferSelect;
export type InsertArchivedUser = z.infer<typeof insertArchivedUserSchema>;

// Leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  propertyAddress: text("property_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerPhone: text("owner_phone"),
  ownerEmail: text("owner_email"),
  status: text("status").default("new"),
  motivationLevel: text("motivation_level").default("unknown"),
  propertyType: text("property_type").default("single-family"),
  source: text("lead_source").default("other"),
  notes: text("notes"),
  arv: integer("arv"),
  repairCost: integer("repair_cost"),
  estimatedValue: integer("estimated_value"),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leadsRelations = relations(leads, ({ one }) => ({
  assignedTo: one(users, {
    fields: [leads.assignedToUserId],
    references: [users.id]
  })
}));

export const insertLeadSchema = createInsertSchema(leads);
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export const leadAssignments = pgTable("lead_assignments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  assignedToUserId: integer("assigned_to_user_id").notNull().references(() => users.id),
  assignedByUserId: integer("assigned_by_user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["assigned", "accepted", "rejected"] }).default("assigned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const leadAssignmentsRelations = relations(leadAssignments, ({ one }) => ({
  lead: one(leads, {
    fields: [leadAssignments.leadId],
    references: [leads.id]
  }),
  assignedTo: one(users, {
    fields: [leadAssignments.assignedToUserId],
    references: [users.id]
  }),
  assignedBy: one(users, {
    fields: [leadAssignments.assignedByUserId],
    references: [users.id]
  }),
}));

export const insertLeadAssignmentSchema = createInsertSchema(leadAssignments);
export type LeadAssignment = typeof leadAssignments.$inferSelect;
export type InsertLeadAssignment = z.infer<typeof insertLeadAssignmentSchema>;

export const communications = pgTable("communications", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  type: text("type").notNull(),
  direction: text("direction").default("outbound"),
  subject: text("subject"),
  body: text("body").notNull(),
  to: text("to").notNull(),
  from: text("from"),
  status: text("status").default("sent"),
  providerMessageId: text("provider_message_id"),
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communicationsRelations = relations(communications, ({ one }) => ({
  lead: one(leads, {
    fields: [communications.leadId],
    references: [leads.id]
  }),
  user: one(users, {
    fields: [communications.createdByUserId],
    references: [users.id]
  }),
}));

export const insertCommunicationSchema = createInsertSchema(communications);
export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;

// Calls table - for tracking calls made to leads
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  callTime: timestamp("call_timestamp").defaultNow().notNull(),
  duration: integer("duration_seconds"),
  outcome: text("outcome"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const callsRelations = relations(calls, ({ one }) => ({
  user: one(users, {
    fields: [calls.userId],
    references: [users.id]
  }),
  lead: one(leads, {
    fields: [calls.leadId],
    references: [leads.id]
  })
}));

export const insertCallSchema = createInsertSchema(calls);
export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;

// Scheduled calls table - for upcoming calls
export const scheduledCalls = pgTable("scheduled_calls", {
  id: serial("id").primaryKey(),
  assignedCallerId: integer("assigned_caller_id").notNull().references(() => users.id),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  dealId: integer("deal_id").references(() => deals.id),
  scheduledTime: timestamp("scheduled_time").notNull(),
  notes: text("notes"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const scheduledCallsRelations = relations(scheduledCalls, ({ one }) => ({
  user: one(users, {
    fields: [scheduledCalls.assignedCallerId],
    references: [users.id]
  }),
  lead: one(leads, {
    fields: [scheduledCalls.leadId],
    references: [leads.id]
  }),
  deal: one(deals, {
    fields: [scheduledCalls.dealId],
    references: [deals.id]
  })
}));

export const insertScheduledCallSchema = createInsertSchema(scheduledCalls);
export type ScheduledCall = typeof scheduledCalls.$inferSelect;
export type InsertScheduledCall = z.infer<typeof insertScheduledCallSchema>;

// Team members table - for tracking performance
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  totalCalls: integer("total_calls").default(0),
  totalLeadsConverted: integer("total_leads_converted").default(0),
  totalRevenueGenerated: numeric("total_revenue_generated", { precision: 10, scale: 2 }).default("0"),
  currentDealsValue: numeric("current_deals_value", { precision: 10, scale: 2 }).default("0"),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id]
  })
}));

export const insertTeamMemberSchema = createInsertSchema(teamMembers);
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

// Activities table - for tracking user activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id]
  })
}));

export const insertActivitySchema = createInsertSchema(activities);
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Timesheet table
export const timesheets = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  totalHours: numeric("total_hours", { precision: 5, scale: 2 }).notNull(),
  description: text("description").notNull(),
  activityType: text("activity_type").notNull(),
  leadId: integer("lead_id").references(() => leads.id),
  approved: boolean("approved").default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const timesheetsRelations = relations(timesheets, ({ one }) => ({
  user: one(users, {
    fields: [timesheets.userId],
    references: [users.id]
  }),
  lead: one(leads, {
    fields: [timesheets.leadId],
    references: [leads.id]
  }),
  approver: one(users, {
    fields: [timesheets.approvedBy],
    references: [users.id]
  })
}));

export const insertTimesheetSchema = createInsertSchema(timesheets);
export type Timesheet = typeof timesheets.$inferSelect;
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;

// Pipeline stages - customizable sales pipeline
export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertPipelineStageSchema = createInsertSchema(pipelineStages);
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;

// Deals table - opportunities moving through the pipeline
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  leadId: integer("lead_id").references(() => leads.id),
  ownerUserId: integer("owner_user_id").notNull().references(() => users.id),
  stageId: integer("stage_id").notNull().references(() => pipelineStages.id),
  value: numeric("value", { precision: 12, scale: 2 }).default("0"),
  probability: integer("probability").default(0),
  expectedCloseDate: date("expected_close_date"),
  status: text("status", { enum: ["open", "closed_won", "closed_lost"] }).default("open"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const dealsRelations = relations(deals, ({ one }) => ({
  owner: one(users, {
    fields: [deals.ownerUserId],
    references: [users.id],
  }),
  stage: one(pipelineStages, {
    fields: [deals.stageId],
    references: [pipelineStages.id],
  }),
  lead: one(leads, {
    fields: [deals.leadId],
    references: [leads.id],
  }),
}));

export const insertDealSchema = createInsertSchema(deals);
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

// Messaging channels table - for organizing conversations
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["direct", "group", "lead", "team"] }).default("group"),
  leadId: integer("lead_id").references(() => leads.id),
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  discordWebhookUrl: text("discord_webhook_url"),
  discordChannelId: text("discord_channel_id"),
  discordMirroringEnabled: boolean("discord_mirroring_enabled").default(false),
  whatsappPhoneNumberId: text("whatsapp_phone_number_id"),
  whatsappMirroringEnabled: boolean("whatsapp_mirroring_enabled").default(false),
});

export const channelsRelations = relations(channels, ({ one, many }) => ({
  lead: one(leads, {
    fields: [channels.leadId],
    references: [leads.id]
  }),
  createdBy: one(users, {
    fields: [channels.createdByUserId],
    references: [users.id]
  }),
  members: many(channelMembers),
  messages: many(messages)
}));

export const insertChannelSchema = createInsertSchema(channels);
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;

// Channel members table - for managing channel participants
export const channelMembers = pgTable("channel_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => channels.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["admin", "member"] }).default("member"),
  lastReadAt: timestamp("last_read_at"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true),
});

export const channelMembersRelations = relations(channelMembers, ({ one }) => ({
  channel: one(channels, {
    fields: [channelMembers.channelId],
    references: [channels.id]
  }),
  user: one(users, {
    fields: [channelMembers.userId],
    references: [users.id]
  })
}));

export const insertChannelMemberSchema = createInsertSchema(channelMembers);
export type ChannelMember = typeof channelMembers.$inferSelect;
export type InsertChannelMember = z.infer<typeof insertChannelMemberSchema>;

// Messages table - for storing all messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => channels.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type", { enum: ["text", "image", "file", "system"] }).default("text"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  replyToMessageId: integer("reply_to_message_id").references((): any => messages.id),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const messagesRelations = relations(messages, ({ one, many }) => ({
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id]
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id]
  }),
  replyTo: one(messages, {
    fields: [messages.replyToMessageId],
    references: [messages.id]
  }),
  replies: many(messages),
  readReceipts: many(messageReadReceipts),
  reactions: many(messageReactions)
}));

export const insertMessageSchema = createInsertSchema(messages);
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Message read receipts table - for tracking who has read messages
export const messageReadReceipts = pgTable("message_read_receipts", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

export const messageReadReceiptsRelations = relations(messageReadReceipts, ({ one }) => ({
  message: one(messages, {
    fields: [messageReadReceipts.messageId],
    references: [messages.id]
  }),
  user: one(users, {
    fields: [messageReadReceipts.userId],
    references: [users.id]
  })
}));

export const insertMessageReadReceiptSchema = createInsertSchema(messageReadReceipts);
export type MessageReadReceipt = typeof messageReadReceipts.$inferSelect;
export type InsertMessageReadReceipt = z.infer<typeof insertMessageReadReceiptSchema>;

// Message reactions table - for emoji reactions to messages
export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  emoji: text("emoji").notNull(), // The emoji character(s)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id]
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id]
  })
}));

export const insertMessageReactionSchema = createInsertSchema(messageReactions);
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;

// WhatsApp Business API configuration table
export const whatsappConfigs = pgTable("whatsapp_configs", {
  id: serial("id").primaryKey(),
  phoneNumberId: text("phone_number_id").notNull().unique(),
  businessAccountId: text("business_account_id").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  displayName: text("display_name").notNull(),
  verifiedName: text("verified_name"),
  qualityRating: text("quality_rating", { enum: ["GREEN", "YELLOW", "RED"] }),
  webhookVerifyToken: text("webhook_verify_token").notNull(),
  accessToken: text("access_token").notNull(),
  isActive: boolean("is_active").default(true),
  lastWebhookAt: timestamp("last_webhook_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertWhatsappConfigSchema = createInsertSchema(whatsappConfigs);
export type WhatsappConfig = typeof whatsappConfigs.$inferSelect;
export type InsertWhatsappConfig = z.infer<typeof insertWhatsappConfigSchema>;

// WhatsApp contacts table - extends leads with WhatsApp specific data
export const whatsappContacts = pgTable("whatsapp_contacts", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  phoneNumber: text("phone_number").notNull(),
  waId: text("wa_id"), // WhatsApp ID
  profileName: text("profile_name"),
  about: text("about"),
  profilePictureUrl: text("profile_picture_url"),
  isBlocked: boolean("is_blocked").default(false),
  lastMessageAt: timestamp("last_message_at"),
  messageCount: integer("message_count").default(0),
  optInStatus: boolean("opt_in_status").default(false),
  optInAt: timestamp("opt_in_at"),
  optOutAt: timestamp("opt_out_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const whatsappContactsRelations = relations(whatsappContacts, ({ one }) => ({
  lead: one(leads, {
    fields: [whatsappContacts.leadId],
    references: [leads.id]
  })
}));

export const insertWhatsappContactSchema = createInsertSchema(whatsappContacts);
export type WhatsappContact = typeof whatsappContacts.$inferSelect;
export type InsertWhatsappContact = z.infer<typeof insertWhatsappContactSchema>;

// WhatsApp message templates table
export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", { enum: ["UTILITY", "MARKETING", "AUTHENTICATION"] }).default("UTILITY"),
  language: text("language").default("en_US"),
  status: text("status", { enum: ["APPROVED", "PENDING", "REJECTED", "DISABLED"] }).default("PENDING"),
  headerType: text("header_type", { enum: ["TEXT", "IMAGE", "DOCUMENT", "VIDEO", "LOCATION", "NONE"] }).default("NONE"),
  headerText: text("header_text"),
  headerExample: text("header_example"),
  bodyText: text("body_text").notNull(),
  bodyExample: text("body_example"),
  footerText: text("footer_text"),
  buttons: text("buttons"), // JSON array of buttons
  templateId: text("template_id"), // WhatsApp template ID
  wabaId: text("waba_id"), // WhatsApp Business Account ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates);
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;

// WhatsApp messages table - extends communications with WhatsApp specific data
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  communicationId: integer("communication_id").notNull().references(() => communications.id),
  wamId: text("wam_id").unique(), // WhatsApp message ID
  phoneNumberId: text("phone_number_id").notNull().references(() => whatsappConfigs.phoneNumberId),
  contactId: integer("contact_id").references(() => whatsappContacts.id),
  messageType: text("message_type", { enum: ["text", "image", "document", "audio", "video", "sticker", "location", "contacts", "interactive", "template"] }).default("text"),
  status: text("status", { enum: ["sent", "delivered", "read", "failed", "deleted"] }).default("sent"),
  errorCode: text("error_code"),
  errorTitle: text("error_title"),
  errorDetails: text("error_details"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  failedAt: timestamp("failed_at"),
  isFromCustomer: boolean("is_from_customer").default(false),
  replyToWamId: text("reply_to_wam_id"),
  contextMessageId: text("context_message_id"),
  pricingCategory: text("pricing_category"),
  pricingBillable: boolean("pricing_billable").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  communication: one(communications, {
    fields: [whatsappMessages.communicationId],
    references: [communications.id]
  }),
  config: one(whatsappConfigs, {
    fields: [whatsappMessages.phoneNumberId],
    references: [whatsappConfigs.phoneNumberId]
  }),
  contact: one(whatsappContacts, {
    fields: [whatsappMessages.contactId],
    references: [whatsappContacts.id]
  })
}));

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages);
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;

// Documents table - version-controlled knowledge base documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  tags: text("tags"),
  isPublished: boolean("is_published").default(false),
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const documentsRelations = relations(documents, ({ one, many }) => ({
  author: one(users, {
    fields: [documents.createdByUserId],
    references: [users.id]
  }),
  versions: many(documentVersions),
  comments: many(documentComments)
}));

export const insertDocumentSchema = createInsertSchema(documents);
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Document versions - immutable snapshots with change summaries
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  changeSummary: text("change_summary"),
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id]
  }),
  author: one(users, {
    fields: [documentVersions.createdByUserId],
    references: [users.id]
  })
}));

export const insertDocumentVersionSchema = createInsertSchema(documentVersions);
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

// Document comments - annotations linked to ranges (optional)
export const documentComments = pgTable("document_comments", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  selectionStart: integer("selection_start"),
  selectionEnd: integer("selection_end"),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const documentCommentsRelations = relations(documentComments, ({ one }) => ({
  document: one(documents, {
    fields: [documentComments.documentId],
    references: [documents.id]
  }),
  user: one(users, {
    fields: [documentComments.userId],
    references: [users.id]
  })
}));

export const insertDocumentCommentSchema = createInsertSchema(documentComments);
export type DocumentComment = typeof documentComments.$inferSelect;
export type InsertDocumentComment = z.infer<typeof insertDocumentCommentSchema>;

// Training modules
export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModules);
export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;

export const trainingLessons = pgTable("training_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => trainingModules.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertTrainingLessonSchema = createInsertSchema(trainingLessons);
export type TrainingLesson = typeof trainingLessons.$inferSelect;
export type InsertTrainingLesson = z.infer<typeof insertTrainingLessonSchema>;

export const trainingEnrollments = pgTable("training_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => trainingModules.id),
  status: text("status", { enum: ["enrolled", "in_progress", "completed", "expired"] }).default("enrolled"),
  progressPercent: integer("progress_percent").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertTrainingEnrollmentSchema = createInsertSchema(trainingEnrollments);
export type TrainingEnrollment = typeof trainingEnrollments.$inferSelect;
export type InsertTrainingEnrollment = z.infer<typeof insertTrainingEnrollmentSchema>;

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => trainingModules.id),
  title: text("title").notNull(),
  passingScore: integer("passing_score").default(70),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertAssessmentSchema = createInsertSchema(assessments);
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export const assessmentQuestions = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  type: text("type", { enum: ["multiple_choice", "true_false", "short_answer"] }).default("multiple_choice"),
  prompt: text("prompt").notNull(),
  options: text("options"), // JSON string array
  correctAnswer: text("correct_answer"),
  orderIndex: integer("order_index").default(0),
});

export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions);
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;

export const assessmentSubmissions = pgTable("assessment_submissions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  score: integer("score").default(0),
  passed: boolean("passed").default(false),
  responses: text("responses"), // JSON
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertAssessmentSubmissionSchema = createInsertSchema(assessmentSubmissions);
export type AssessmentSubmission = typeof assessmentSubmissions.$inferSelect;
export type InsertAssessmentSubmission = z.infer<typeof insertAssessmentSubmissionSchema>;

export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => trainingModules.id),
  certificateCode: text("certificate_code").notNull().unique(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const insertCertificationSchema = createInsertSchema(certifications);
export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;

// User Encryption Keys table - for secure messaging
export const userEncryptionKeys = pgTable("user_encryption_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  publicKey: text("public_key").notNull(),
  keyId: text("key_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserEncryptionKeySchema = createInsertSchema(userEncryptionKeys);
export type UserEncryptionKey = typeof userEncryptionKeys.$inferSelect;
export type InsertUserEncryptionKey = z.infer<typeof insertUserEncryptionKeySchema>;

// Notifications table - for storing all types of notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["info", "success", "warning", "error", "message", "mention", "task", "lead", "deal", "system"] }).default("info"),
  category: text("category", { enum: ["in_app", "email", "push", "sms"] }).default("in_app"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"), // URL to navigate to when clicked
  actionText: text("action_text"), // Text for the action button
  icon: text("icon"), // Icon to display (emoji or icon name)
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  expiresAt: timestamp("expires_at"), // When the notification expires
  metadata: text("metadata"), // JSON string for additional data
  relatedId: integer("related_id"), // ID of related entity (message, lead, etc.)
  relatedType: text("related_type"), // Type of related entity
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));

export const insertNotificationSchema = createInsertSchema(notifications);
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Notification preferences table - user settings for different notification types
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  notificationType: text("notification_type").notNull(), // e.g., "message", "mention", "task", "lead", "deal"
  channel: text("channel", { enum: ["in_app", "email", "push", "sms"] }).notNull(),
  isEnabled: boolean("is_enabled").default(true),
  frequency: text("frequency", { enum: ["immediate", "daily", "weekly", "never"] }).default("immediate"),
  quietHoursStart: text("quiet_hours_start"), // HH:MM format
  quietHoursEnd: text("quiet_hours_end"), // HH:MM format
  emailAddress: text("email_address"), // Override email address for this type
  pushDeviceTokens: text("push_device_tokens"), // JSON array of device tokens
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id]
  })
}));

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences);
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

// Email templates table - for customizable email notifications
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  variables: text("variables"), // JSON array of available variables
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// Email queue table - for tracking sent emails and scheduling
export const emailQueue = pgTable("email_queue", {
  id: serial("id").primaryKey(),
  toEmail: text("to_email").notNull(),
  toName: text("to_name"),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  subject: text("subject").notNull(),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  templateId: integer("template_id").references(() => emailTemplates.id),
  status: text("status", { enum: ["pending", "sent", "failed", "bounced"] }).default("pending"),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  scheduledFor: timestamp("scheduled_for"), // For scheduled emails
  notificationId: integer("notification_id").references(() => notifications.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const emailQueueRelations = relations(emailQueue, ({ one }) => ({
  template: one(emailTemplates, {
    fields: [emailQueue.templateId],
    references: [emailTemplates.id]
  }),
  notification: one(notifications, {
    fields: [emailQueue.notificationId],
    references: [notifications.id]
  })
}));

export const insertEmailQueueSchema = createInsertSchema(emailQueue);
export type EmailQueue = typeof emailQueue.$inferSelect;
export type InsertEmailQueue = z.infer<typeof insertEmailQueueSchema>;

// Marketing automation tables
export const marketingWorkflows = pgTable("marketing_workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { enum: ["active", "paused", "draft"] }).default("draft"),
  triggerType: text("trigger_type").notNull(),
  triggerSource: text("trigger_source"),
  triggerEventData: text("trigger_event_data"), // JSON
  conditions: text("conditions"), // JSON array
  actions: text("actions").notNull(), // JSON array
  settings: text("settings").notNull(), // JSON
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const marketingWorkflowsRelations = relations(marketingWorkflows, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [marketingWorkflows.createdByUserId],
    references: [users.id]
  }),
  executions: many(marketingExecutions)
}));

export const insertMarketingWorkflowSchema = createInsertSchema(marketingWorkflows);
export type MarketingWorkflow = typeof marketingWorkflows.$inferSelect;
export type InsertMarketingWorkflow = z.infer<typeof insertMarketingWorkflowSchema>;

export const marketingForms = pgTable("marketing_forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fields: text("fields").notNull(), // JSON array
  submitButtonText: text("submit_button_text").default("Submit"),
  successMessage: text("success_message").default("Thank you for your submission!"),
  errorMessage: text("error_message").default("Something went wrong. Please try again."),
  redirectUrl: text("redirect_url"),
  enableProgressiveProfiling: boolean("enable_progressive_profiling").default(false),
  enableDoubleOptIn: boolean("enable_double_opt_in").default(false),
  consentText: text("consent_text"),
  styling: text("styling"), // JSON
  workflows: text("workflows"), // JSON array of workflow IDs
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const marketingFormsRelations = relations(marketingForms, ({ one }) => ({
  createdBy: one(users, {
    fields: [marketingForms.createdByUserId],
    references: [users.id]
  })
}));

export const insertMarketingFormSchema = createInsertSchema(marketingForms);
export type MarketingForm = typeof marketingForms.$inferSelect;
export type InsertMarketingForm = z.infer<typeof insertMarketingFormSchema>;

export const marketingExecutions = pgTable("marketing_executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => marketingWorkflows.id),
  leadId: integer("lead_id").references(() => leads.id),
  status: text("status", { enum: ["pending", "running", "completed", "failed", "cancelled"] }).default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  executionData: text("execution_data"), // JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const marketingExecutionsRelations = relations(marketingExecutions, ({ one }) => ({
  workflow: one(marketingWorkflows, {
    fields: [marketingExecutions.workflowId],
    references: [marketingWorkflows.id]
  }),
  lead: one(leads, {
    fields: [marketingExecutions.leadId],
    references: [leads.id]
  })
}));

export const insertMarketingExecutionSchema = createInsertSchema(marketingExecutions);
export type MarketingExecution = typeof marketingExecutions.$inferSelect;
export type InsertMarketingExecution = z.infer<typeof insertMarketingExecutionSchema>;

export const marketingMessages = pgTable("marketing_messages", {
  id: serial("id").primaryKey(),
  executionId: integer("execution_id").references(() => marketingExecutions.id),
  leadId: integer("lead_id").references(() => leads.id),
  messageType: text("message_type", { enum: ["email", "sms", "whatsapp", "push"] }).notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  status: text("status", { enum: ["pending", "sent", "delivered", "failed", "bounced"] }).default("pending"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const marketingMessagesRelations = relations(marketingMessages, ({ one }) => ({
  execution: one(marketingExecutions, {
    fields: [marketingMessages.executionId],
    references: [marketingExecutions.id]
  }),
  lead: one(leads, {
    fields: [marketingMessages.leadId],
    references: [leads.id]
  })
}));

export const insertMarketingMessageSchema = createInsertSchema(marketingMessages);
export type MarketingMessage = typeof marketingMessages.$inferSelect;
export type InsertMarketingMessage = z.infer<typeof insertMarketingMessageSchema>;

export const marketingAnalytics = pgTable("marketing_analytics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type", { enum: ["workflow_execution", "form_submission", "email_sent", "email_opened", "email_clicked", "sms_sent", "whatsapp_sent", "whatsapp_delivered", "whatsapp_read", "conversion"] }).notNull(),
  metricValue: integer("metric_value").default(1),
  workflowId: integer("workflow_id").references(() => marketingWorkflows.id),
  formId: integer("form_id").references(() => marketingForms.id),
  leadId: integer("lead_id").references(() => leads.id),
  executionId: integer("execution_id").references(() => marketingExecutions.id),
  messageId: integer("message_id").references(() => marketingMessages.id),
  campaignId: text("campaign_id"),
  source: text("source"),
  metadata: text("metadata"), // JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketingAnalyticsRelations = relations(marketingAnalytics, ({ one }) => ({
  workflow: one(marketingWorkflows, {
    fields: [marketingAnalytics.workflowId],
    references: [marketingWorkflows.id]
  }),
  form: one(marketingForms, {
    fields: [marketingAnalytics.formId],
    references: [marketingForms.id]
  }),
  lead: one(leads, {
    fields: [marketingAnalytics.leadId],
    references: [leads.id]
  }),
  execution: one(marketingExecutions, {
    fields: [marketingAnalytics.executionId],
    references: [marketingExecutions.id]
  }),
  message: one(marketingMessages, {
    fields: [marketingAnalytics.messageId],
    references: [marketingMessages.id]
  })
}));

export const insertMarketingAnalyticsSchema = createInsertSchema(marketingAnalytics);
export type MarketingAnalytics = typeof marketingAnalytics.$inferSelect;
export type InsertMarketingAnalytics = z.infer<typeof insertMarketingAnalyticsSchema>;
