import { 
  users, 
  leads,
  calls,
  scheduledCalls,
  teamMembers,
  activities,
  timesheets,
  leadAssignments,
  LeadAssignment,
  InsertLeadAssignment,
  communications,
  Communication,
  InsertCommunication,
  User, 
  InsertUser,
  Lead,
  InsertLead,
  Call,
  InsertCall,
  ScheduledCall,
  InsertScheduledCall,
  TeamMember,
  InsertTeamMember,
  Activity,
  InsertActivity,
  Timesheet,
  InsertTimesheet,
  channels,
  channelMembers,
  messages,
  messageReadReceipts,
  messageReactions,
  Channel,
  InsertChannel,
  ChannelMember,
  InsertChannelMember,
  Message,
  InsertMessage,
  MessageReadReceipt,
  InsertMessageReadReceipt,
  MessageReaction,
  InsertMessageReaction,
  whatsappConfigs,
  WhatsappConfig,
  InsertWhatsappConfig,
  whatsappContacts,
  WhatsappContact,
  InsertWhatsappContact,
  whatsappTemplates,
  WhatsappTemplate,
  InsertWhatsappTemplate,
  whatsappMessages,
  WhatsappMessage,
  InsertWhatsappMessage,
  userEncryptionKeys,
  UserEncryptionKey,
  InsertUserEncryptionKey,
  documents,
  Document,
  InsertDocument,
  documentVersions,
  DocumentVersion,
  InsertDocumentVersion,
  documentComments,
  DocumentComment,
  InsertDocumentComment,
  pipelineStages,
  PipelineStage,
  InsertPipelineStage,
  deals,
  Deal,
  InsertDeal
} from "@/db/schema";
import {
  trainingModules,
  TrainingModule,
  InsertTrainingModule,
  trainingLessons,
  TrainingLesson,
  InsertTrainingLesson,
  trainingEnrollments,
  TrainingEnrollment,
  InsertTrainingEnrollment,
  assessments,
  Assessment,
  InsertAssessment,
  assessmentQuestions,
  AssessmentQuestion,
  InsertAssessmentQuestion,
  assessmentSubmissions,
  AssessmentSubmission,
  InsertAssessmentSubmission,
  certifications,
  Certification,
  InsertCertification
} from "@/db/schema";
import { db } from "@/lib/db";
import { eq, and, desc, asc, like, or, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { generateLeadId, extractLeadNumber, getCurrentYearPrefix } from "@/lib/utils/lead-utils";

export interface LeadFilters {
  status?: string[];
  search?: string;
  assignedToUserId?: number;
  createdByUserId?: number;
  phone?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ScheduledCallFilters {
  status?: string;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface TimesheetFilters {
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  approved?: boolean;
}

export interface DealFilters {
  stageId?: number;
  ownerUserId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export class Storage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Message Reaction functions
  async getMessageReactions(messageId: number): Promise<MessageReaction[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      emoji text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );`);
    return await db
      .select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId))
      .orderBy(desc(messageReactions.createdAt));
  }

  async getMessageReactionsByEmoji(messageId: number, emoji: string): Promise<MessageReaction[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      emoji text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );`);
    return await db
      .select()
      .from(messageReactions)
      .where(and(eq(messageReactions.messageId, messageId), eq(messageReactions.emoji, emoji)))
      .orderBy(desc(messageReactions.createdAt));
  }

  async addMessageReaction(insert: InsertMessageReaction): Promise<MessageReaction> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      emoji text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );`);
    const [reaction] = await db
      .insert(messageReactions)
      .values(insert)
      .returning();
    return reaction;
  }

  async removeMessageReaction(messageId: number, userId: number, emoji: string): Promise<boolean> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      emoji text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );`);
    try {
      await db
        .delete(messageReactions)
        .where(and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        ));
      return true;
    } catch (error) {
      console.error(`Error removing message reaction:`, error);
      return false;
    }
  }

  async getMessageReactionSummary(messageId: number): Promise<Array<{ emoji: string; count: number; userIds: number[] }>> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      emoji text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );`);
    
    const reactions = await db
      .select({
        emoji: messageReactions.emoji,
        userId: messageReactions.userId,
      })
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId))
      .orderBy(desc(messageReactions.createdAt));

    const summary: Record<string, { emoji: string; count: number; userIds: number[] }> = {};
    
    reactions.forEach(reaction => {
      if (!summary[reaction.emoji]) {
        summary[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          userIds: []
        };
      }
      summary[reaction.emoji].count++;
      summary[reaction.emoji].userIds.push(reaction.userId);
    });

    return Object.values(summary);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      const user = await this.getUser(id);
      if (!user) {
        return false;
      }
      
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      return false;
    }
  }

  async resetUsersKeepAdmin(): Promise<{ deletedUserCount: number; adminCount: number }> {
    const adminUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));
    const adminIds = adminUsers.map(u => u.id);
    const nonAdminUsers = await db.select({ id: users.id }).from(users).where(sql`${users.role} != 'admin'`);
    const nonAdminIds = nonAdminUsers.map(u => u.id);
    let deleted = 0;
    if (nonAdminIds.length > 0) {
      await db.delete(teamMembers).where(inArray(teamMembers.userId, nonAdminIds));
      await db.delete(activities).where(inArray(activities.userId, nonAdminIds));
      await db.delete(calls).where(inArray(calls.userId, nonAdminIds));
      await db.delete(scheduledCalls).where(inArray(scheduledCalls.assignedCallerId, nonAdminIds));
      await db.delete(timesheets).where(inArray(timesheets.userId, nonAdminIds));
      await db.delete(channels).where(inArray(channels.createdByUserId, nonAdminIds));
      await db.delete(channelMembers).where(inArray(channelMembers.userId, nonAdminIds));
      await db.delete(messages).where(inArray(messages.userId, nonAdminIds));
      await db.delete(messageReadReceipts).where(inArray(messageReadReceipts.userId, nonAdminIds));
      await db.delete(communications).where(inArray(communications.createdByUserId, nonAdminIds));
      await db.delete(userEncryptionKeys).where(inArray(userEncryptionKeys.userId, nonAdminIds));
      await db.delete(leadAssignments).where(or(inArray(leadAssignments.assignedToUserId, nonAdminIds), inArray(leadAssignments.assignedByUserId, nonAdminIds)));
      const res = await db.delete(users).where(inArray(users.id, nonAdminIds));
      deleted = nonAdminIds.length;
    }
    return { deletedUserCount: deleted, adminCount: adminIds.length };
  }
  
  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }
  
  async getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
    const conditions: any[] = [];
    
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(leads.status, filters.status));
    }
    
    if (filters.assignedToUserId) {
      conditions.push(eq(leads.assignedToUserId, filters.assignedToUserId));
    }
    
    if (filters.createdByUserId) {
      try {
        console.log('Filtering by createdByUserId:', filters.createdByUserId);
        
        const creationActivities = await db
          .select()
          .from(activities)
          .where(and(
            eq(activities.userId, filters.createdByUserId),
            eq(activities.actionType, 'create'),
            eq(activities.targetType, 'lead')
          ));
          
        console.log(`Found ${creationActivities.length} lead creation activities for user ${filters.createdByUserId}`);
        
        if (creationActivities.length > 0) {
          const leadIds = creationActivities.map(activity => activity.targetId);
          conditions.push(inArray(leads.id, leadIds));
        } else {
          console.log('No leads created by this user, returning empty result');
          return [];
        }
      } catch (error) {
        console.error('Error in createdByUserId filter:', error);
      }
    }
    
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(leads.propertyAddress, searchTerm),
          like(leads.ownerName, searchTerm),
          like(leads.ownerPhone, searchTerm),
          like(leads.ownerEmail, searchTerm)
        )
      );
    }

    if (filters.phone) {
      const phoneTerm = `%${filters.phone}%`;
      conditions.push(like(leads.ownerPhone, phoneTerm));
    }
    
    let query = db.select().from(leads);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    if (filters.sortBy) {
      const sortColumnValue = leads[filters.sortBy as keyof typeof leads];
      const sortColumn = (typeof sortColumnValue === 'function' || !sortColumnValue) 
        ? leads.createdAt 
        : sortColumnValue as any;
      if (filters.sortOrder === 'asc') {
        query = query.orderBy(asc(sortColumn)) as typeof query;
      } else {
        query = query.orderBy(desc(sortColumn)) as typeof query;
      }
    } else {
      query = query.orderBy(desc(leads.createdAt)) as typeof query;
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit) as typeof query;
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset) as typeof query;
    }
    
    return await query;
  }
  
  async createLead(insertLead: InsertLead): Promise<Lead> {
    try {
      console.log('Creating lead with data:', insertLead);
      
      const [latestLead] = await db
        .select()
        .from(leads)
        .where(like(leads.leadId, `${getCurrentYearPrefix()}%`))
        .orderBy(desc(leads.id))
        .limit(1);
      
      console.log('Latest lead found:', latestLead);
      
      const lastLeadNumber = latestLead ? extractLeadNumber(latestLead.leadId) : 0;
      console.log('Last lead number:', lastLeadNumber);
      
      const leadId = insertLead.leadId || generateLeadId(lastLeadNumber);
      console.log('Generated leadId:', leadId);
      
      const leadToInsert = {
        ...insertLead,
        leadId,
      };
      
      const [lead] = await db
        .insert(leads)
        .values(leadToInsert)
        .returning();
      
      console.log('Lead created successfully:', lead);
      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }
  
  async updateLead(id: number, updateData: Partial<InsertLead>): Promise<Lead | undefined> {
    try {
      const lead = await this.getLead(id);
      if (!lead) {
        return undefined;
      }
      
      const [updatedLead] = await db
        .update(leads)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, id))
        .returning();
      
      return updatedLead;
    } catch (error) {
      console.error(`Error updating lead with ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteLead(id: number): Promise<boolean> {
    try {
      const lead = await this.getLead(id);
      if (!lead) {
        return false;
      }
      
      await db.delete(leads).where(eq(leads.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting lead with ID ${id}:`, error);
      return false;
    }
  }

  // Pipeline stages
  async getPipelineStages(): Promise<PipelineStage[]> {
    return await db.select().from(pipelineStages).orderBy(pipelineStages.orderIndex);
  }

  async createPipelineStage(insert: InsertPipelineStage): Promise<PipelineStage> {
    const [stage] = await db.insert(pipelineStages).values(insert).returning();
    return stage;
  }

  async updatePipelineStage(id: number, updateData: Partial<InsertPipelineStage>): Promise<PipelineStage | undefined> {
    const [updated] = await db
      .update(pipelineStages)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(pipelineStages.id, id))
      .returning();
    return updated;
  }

  async deletePipelineStage(id: number): Promise<boolean> {
    try {
      await db.delete(pipelineStages).where(eq(pipelineStages.id, id));
      return true;
    } catch (e) {
      console.error('Error deleting pipeline stage', e);
      return false;
    }
  }

  // Deals
  async getDeal(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async getDeals(filters: DealFilters = {}): Promise<Deal[]> {
    const conditions: any[] = [];
    if (filters.stageId) conditions.push(eq(deals.stageId, filters.stageId));
    if (filters.ownerUserId) conditions.push(eq(deals.ownerUserId, filters.ownerUserId));
    if (filters.status) conditions.push(eq(deals.status, filters.status as any));
    if (filters.startDate) conditions.push(sql`${deals.expectedCloseDate} >= ${filters.startDate}`);
    if (filters.endDate) conditions.push(sql`${deals.expectedCloseDate} <= ${filters.endDate}`);
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(or(like(deals.title, term), like(deals.notes, term)));
    }
    let query = db.select().from(deals);
    if (conditions.length > 0) query = query.where(and(...conditions)) as typeof query;
    return await query.orderBy(desc(deals.createdAt));
  }

  async createDeal(insert: InsertDeal): Promise<Deal> {
    const [deal] = await db.insert(deals).values(insert).returning();
    return deal;
  }

  async updateDeal(id: number, updateData: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [updated] = await db
      .update(deals)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updated;
  }

  async moveDealToStage(id: number, stageId: number): Promise<Deal | undefined> {
    const [updated] = await db
      .update(deals)
      .set({ stageId, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updated;
  }

  async deleteDeal(id: number): Promise<boolean> {
    try {
      await db.delete(deals).where(eq(deals.id, id));
      return true;
    } catch (e) {
      console.error('Error deleting deal', e);
      return false;
    }
  }

  async getLeadAssignments(leadId?: number, userId?: number, status?: string): Promise<LeadAssignment[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS lead_assignments (
      id serial PRIMARY KEY,
      lead_id integer NOT NULL REFERENCES leads(id),
      assigned_to_user_id integer NOT NULL REFERENCES users(id),
      assigned_by_user_id integer NOT NULL REFERENCES users(id),
      status text DEFAULT 'assigned',
      notes text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    const conditions: any[] = [];
    if (leadId) {
      conditions.push(eq(leadAssignments.leadId, leadId));
    }
    if (userId) {
      conditions.push(eq(leadAssignments.assignedToUserId, userId));
    }
    if (status) {
      const s = status as 'assigned' | 'accepted' | 'rejected';
      conditions.push(eq(leadAssignments.status, s));
    }
    let query = db.select().from(leadAssignments);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    return await query.orderBy(desc(leadAssignments.createdAt));
  }

  async createLeadAssignment(insert: InsertLeadAssignment): Promise<LeadAssignment> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS lead_assignments (
      id serial PRIMARY KEY,
      lead_id integer NOT NULL REFERENCES leads(id),
      assigned_to_user_id integer NOT NULL REFERENCES users(id),
      assigned_by_user_id integer NOT NULL REFERENCES users(id),
      status text DEFAULT 'assigned',
      notes text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    const [assignment] = await db
      .insert(leadAssignments)
      .values(insert)
      .returning();
    return assignment;
  }

  async updateLeadAssignment(id: number, updateData: Partial<InsertLeadAssignment>): Promise<LeadAssignment | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS lead_assignments (
      id serial PRIMARY KEY,
      lead_id integer NOT NULL REFERENCES leads(id),
      assigned_to_user_id integer NOT NULL REFERENCES users(id),
      assigned_by_user_id integer NOT NULL REFERENCES users(id),
      status text DEFAULT 'assigned',
      notes text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    const [existing] = await db.select().from(leadAssignments).where(eq(leadAssignments.id, id));
    if (!existing) {
      return undefined;
    }
    const [updated] = await db
      .update(leadAssignments)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(leadAssignments.id, id))
      .returning();
    return updated;
  }

  async getCommunications(filters?: {
    leadId?: number;
    providerMessageId?: string;
    limit?: number;
  }): Promise<Communication[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS communications (
      id serial PRIMARY KEY,
      lead_id integer NOT NULL REFERENCES leads(id),
      type text NOT NULL,
      direction text DEFAULT 'outbound',
      subject text,
      body text NOT NULL,
      to text NOT NULL,
      from text,
      status text DEFAULT 'sent',
      provider_message_id text,
      created_by_user_id integer NOT NULL REFERENCES users(id),
      created_at timestamp DEFAULT now() NOT NULL,
      delivered_at timestamp,
      read_at timestamp,
      failed_at timestamp,
      error_code text,
      error_title text,
      error_details text,
      metadata jsonb
    );`);
    
    if (filters?.leadId && filters?.providerMessageId) {
      return await db
        .select()
        .from(communications)
        .where(and(
          eq(communications.leadId, filters.leadId),
          eq(communications.providerMessageId, filters.providerMessageId)
        ))
        .orderBy(desc(communications.createdAt))
        .limit(filters.limit || 100);
    }
    
    if (filters?.leadId) {
      return await db
        .select()
        .from(communications)
        .where(eq(communications.leadId, filters.leadId))
        .orderBy(desc(communications.createdAt))
        .limit(filters.limit || 100);
    }
    
    if (filters?.providerMessageId) {
      return await db
        .select()
        .from(communications)
        .where(eq(communications.providerMessageId, filters.providerMessageId))
        .orderBy(desc(communications.createdAt))
        .limit(filters.limit || 100);
    }
    
    return await db
      .select()
      .from(communications)
      .orderBy(desc(communications.createdAt))
      .limit(filters?.limit || 100);
  }

  async createCommunication(insert: InsertCommunication): Promise<Communication> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS communications (
      id serial PRIMARY KEY,
      lead_id integer NOT NULL REFERENCES leads(id),
      type text NOT NULL,
      direction text DEFAULT 'outbound',
      subject text,
      body text NOT NULL,
      to text NOT NULL,
      from text,
      status text DEFAULT 'sent',
      provider_message_id text,
      created_by_user_id integer NOT NULL REFERENCES users(id),
      created_at timestamp DEFAULT now() NOT NULL,
      delivered_at timestamp,
      read_at timestamp,
      failed_at timestamp,
      error_code text,
      error_title text,
      error_details text,
      metadata jsonb
    );`);
    const [comm] = await db
      .insert(communications)
      .values(insert)
      .returning();
    return comm;
  }

  async updateCommunication(id: number, update: Partial<Communication>): Promise<Communication> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS communications (
      id serial PRIMARY KEY,
      lead_id integer NOT NULL REFERENCES leads(id),
      type text NOT NULL,
      direction text DEFAULT 'outbound',
      subject text,
      body text NOT NULL,
      to text NOT NULL,
      from text,
      status text DEFAULT 'sent',
      provider_message_id text,
      created_by_user_id integer NOT NULL REFERENCES users(id),
      created_at timestamp DEFAULT now() NOT NULL,
      delivered_at timestamp,
      read_at timestamp,
      failed_at timestamp,
      error_code text,
      error_title text,
      error_details text,
      metadata jsonb
    );`);
    const [updated] = await db
      .update(communications)
      .set(update)
      .where(eq(communications.id, id))
      .returning();
    return updated;
  }
  
  async getCall(id: number): Promise<Call | undefined> {
    const [call] = await db.select().from(calls).where(eq(calls.id, id));
    return call;
  }
  
  async getCalls(leadId?: number, userId?: number): Promise<Call[]> {
    const conditions: any[] = [];
    
    if (leadId) {
      conditions.push(eq(calls.leadId, leadId));
    }
    
    if (userId) {
      conditions.push(eq(calls.userId, userId));
    }
    
    let query = db.select().from(calls);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    return await query.orderBy(desc(calls.callTime));
  }
  
  async createCall(insertCall: InsertCall): Promise<Call> {
    const [call] = await db
      .insert(calls)
      .values(insertCall)
      .returning();
    return call;
  }
  
  async deleteCall(id: number): Promise<boolean> {
    try {
      const call = await this.getCall(id);
      if (!call) {
        return false;
      }
      
      await db.delete(calls).where(eq(calls.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting call with ID ${id}:`, error);
      return false;
    }
  }
  
  async getScheduledCall(id: number): Promise<ScheduledCall | undefined> {
    const [scheduledCall] = await db.select().from(scheduledCalls).where(eq(scheduledCalls.id, id));
    return scheduledCall;
  }
  
  async getScheduledCalls(filters: ScheduledCallFilters = {}): Promise<ScheduledCall[]> {
    const conditions: any[] = [];
    
    if (filters.status) {
      conditions.push(eq(scheduledCalls.status, filters.status));
    }
    
    if (filters.userId) {
      conditions.push(eq(scheduledCalls.assignedCallerId, filters.userId));
    }
    
    let query = db.select().from(scheduledCalls);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    return await query.orderBy(asc(scheduledCalls.scheduledTime));
  }
  
  async createScheduledCall(insertScheduledCall: InsertScheduledCall): Promise<ScheduledCall> {
    const [scheduledCall] = await db
      .insert(scheduledCalls)
      .values(insertScheduledCall)
      .returning();
    return scheduledCall;
  }
  
  async updateScheduledCall(id: number, updateData: Partial<InsertScheduledCall>): Promise<ScheduledCall | undefined> {
    try {
      const scheduledCall = await this.getScheduledCall(id);
      if (!scheduledCall) {
        return undefined;
      }
      
      const [updated] = await db
        .update(scheduledCalls)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(scheduledCalls.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error(`Error updating scheduled call with ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteScheduledCall(id: number): Promise<boolean> {
    try {
      const scheduledCall = await this.getScheduledCall(id);
      if (!scheduledCall) {
        return false;
      }
      
      await db.delete(scheduledCalls).where(eq(scheduledCalls.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting scheduled call with ID ${id}:`, error);
      return false;
    }
  }
  
  async getTeamMember(userId: number): Promise<TeamMember | undefined> {
    const [teamMember] = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    return teamMember;
  }
  
  async createOrUpdateTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const existing = await this.getTeamMember(insertTeamMember.userId);
    
    if (existing) {
      const [updated] = await db
        .update(teamMembers)
        .set({
          ...insertTeamMember,
          updatedAt: new Date(),
        })
        .where(eq(teamMembers.userId, insertTeamMember.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(teamMembers)
        .values(insertTeamMember)
        .returning();
      return created;
    }
  }
  
  async getActivities(limit?: number, offset?: number): Promise<Activity[]> {
    let query = db.select().from(activities).orderBy(desc(activities.createdAt));
    
    if (limit) {
      query = query.limit(limit) as typeof query;
    }
    
    if (offset) {
      query = query.offset(offset) as typeof query;
    }
    
    return await query;
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }
  
  async getTimesheet(id: number): Promise<Timesheet | undefined> {
    const [timesheet] = await db.select().from(timesheets).where(eq(timesheets.id, id));
    return timesheet;
  }
  
  async getTimesheets(filters: TimesheetFilters = {}): Promise<Timesheet[]> {
    const conditions: any[] = [];
    
    if (filters.userId) {
      conditions.push(eq(timesheets.userId, filters.userId));
    }
    
    if (filters.approved !== undefined) {
      conditions.push(eq(timesheets.approved, filters.approved));
    }
    
    let query = db.select().from(timesheets);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    return await query.orderBy(desc(timesheets.date));
  }
  
  async createTimesheet(insertTimesheet: InsertTimesheet): Promise<Timesheet> {
    const [timesheet] = await db
      .insert(timesheets)
      .values(insertTimesheet)
      .returning();
    return timesheet;
  }
  
  async updateTimesheet(id: number, updateData: Partial<InsertTimesheet>): Promise<Timesheet | undefined> {
    try {
      const timesheet = await this.getTimesheet(id);
      if (!timesheet) {
        return undefined;
      }
      
      const [updated] = await db
        .update(timesheets)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(timesheets.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error(`Error updating timesheet with ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteTimesheet(id: number): Promise<boolean> {
    try {
      const timesheet = await this.getTimesheet(id);
      if (!timesheet) {
        return false;
      }
      
      await db.delete(timesheets).where(eq(timesheets.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting timesheet with ID ${id}:`, error);
      return false;
    }
  }

  // Documents
  async getDocuments(search?: string, tag?: string, limit = 50, offset = 0): Promise<Document[]> {
    let query = db.select().from(documents);
    const conditions: any[] = [];
    if (search) {
      const term = `%${search}%`;
      conditions.push(or(like(documents.title, term), like(documents.content, term), like(documents.tags, term)));
    }
    if (tag) {
      const term = `%${tag}%`;
      conditions.push(like(documents.tags, term));
    }
    if (conditions.length > 0) {
      query = (query.where(and(...conditions)) as typeof query);
    }
    return await query.orderBy(desc(documents.createdAt)).limit(limit).offset(offset);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async getDocumentBySlug(slug: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.slug, slug));
    return doc;
  }

  async createDocument(insert: InsertDocument): Promise<Document> {
    const [doc] = await db.insert(documents).values(insert).returning();
    return doc;
  }

  async updateDocument(id: number, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db.update(documents).set({ ...updateData, updatedAt: new Date() }).where(eq(documents.id, id)).returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    await db.delete(documentComments).where(eq(documentComments.documentId, id));
    await db.delete(documentVersions).where(eq(documentVersions.documentId, id));
    const res = await db.delete(documents).where(eq(documents.id, id));
    return !!res;
  }

  // Document versions
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return await db.select().from(documentVersions).where(eq(documentVersions.documentId, documentId)).orderBy(desc(documentVersions.versionNumber));
  }

  async createDocumentVersion(insert: InsertDocumentVersion): Promise<DocumentVersion> {
    const [latest] = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, insert.documentId))
      .orderBy(desc(documentVersions.versionNumber))
      .limit(1);
    const nextVersion = latest ? latest.versionNumber + 1 : 1;
    const [version] = await db
      .insert(documentVersions)
      .values({ ...insert, versionNumber: insert.versionNumber ?? nextVersion })
      .returning();
    return version;
  }

  // Document comments
  async getDocumentComments(documentId: number): Promise<DocumentComment[]> {
    return await db.select().from(documentComments).where(eq(documentComments.documentId, documentId)).orderBy(desc(documentComments.createdAt));
  }

  async createDocumentComment(insert: InsertDocumentComment): Promise<DocumentComment> {
    const [comment] = await db.insert(documentComments).values(insert).returning();
    return comment;
  }

  // Training modules
  async getTrainingModules(): Promise<TrainingModule[]> {
    return await db.select().from(trainingModules).orderBy(desc(trainingModules.createdAt));
  }

  async createTrainingModule(insert: InsertTrainingModule): Promise<TrainingModule> {
    const [mod] = await db.insert(trainingModules).values(insert).returning();
    return mod;
  }

  async updateTrainingModule(id: number, updateData: Partial<InsertTrainingModule>): Promise<TrainingModule | undefined> {
    const [updated] = await db.update(trainingModules).set({ ...updateData, updatedAt: new Date() }).where(eq(trainingModules.id, id)).returning();
    return updated;
  }

  async getLessons(moduleId: number): Promise<TrainingLesson[]> {
    return await db.select().from(trainingLessons).where(eq(trainingLessons.moduleId, moduleId)).orderBy(asc(trainingLessons.orderIndex));
  }

  async createLesson(insert: InsertTrainingLesson): Promise<TrainingLesson> {
    const [lesson] = await db.insert(trainingLessons).values(insert).returning();
    return lesson;
  }

  async enrollUser(insert: InsertTrainingEnrollment): Promise<TrainingEnrollment> {
    const [en] = await db.insert(trainingEnrollments).values(insert).returning();
    return en;
  }

  async updateEnrollment(id: number, updateData: Partial<InsertTrainingEnrollment>): Promise<TrainingEnrollment | undefined> {
    const [updated] = await db.update(trainingEnrollments).set({ ...updateData, updatedAt: new Date() }).where(eq(trainingEnrollments.id, id)).returning();
    return updated;
  }

  async createAssessment(insert: InsertAssessment): Promise<Assessment> {
    const [a] = await db.insert(assessments).values(insert).returning();
    return a;
  }

  async getAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]> {
    return await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.assessmentId, assessmentId)).orderBy(asc(assessmentQuestions.orderIndex));
  }

  async createAssessmentQuestion(insert: InsertAssessmentQuestion): Promise<AssessmentQuestion> {
    const [q] = await db.insert(assessmentQuestions).values(insert).returning();
    return q;
  }

  async submitAssessment(insert: InsertAssessmentSubmission): Promise<AssessmentSubmission> {
    const [sub] = await db.insert(assessmentSubmissions).values(insert).returning();
    return sub;
  }

  async issueCertification(insert: InsertCertification): Promise<Certification> {
    const [cert] = await db.insert(certifications).values(insert).returning();
    return cert;
  }

  async updateWhatsAppContact(id: number, updateData: Partial<{
    leadId?: number;
    phoneNumber?: string;
    waId?: string;
    profileName?: string;
    about?: string;
    profilePictureUrl?: string;
    isBlocked?: boolean;
    lastMessageAt?: Date;
    messageCount?: number;
    optIn?: boolean;
    optInAt?: Date;
    optOutAt?: Date;
    updatedAt?: Date;
  }>): Promise<WhatsappContact | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS whatsapp_contacts (
      id serial PRIMARY KEY,
      lead_id integer NOT NULL REFERENCES leads(id),
      phone_number text NOT NULL,
      wa_id text,
      profile_name text,
      about text,
      profile_picture_url text,
      is_blocked boolean DEFAULT false,
      last_message_at timestamp,
      message_count integer DEFAULT 0,
      opt_in boolean DEFAULT false,
      opt_in_at timestamp,
      opt_out_at timestamp,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP
    );`);
    
    const [updated] = await db
      .update(whatsappContacts)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(whatsappContacts.id, id))
      .returning();
    
    return updated;
  }
}

export const storage = new Storage();

// Messaging storage functions
export class MessagingStorage {
  // Channel functions
  async getChannel(id: number): Promise<Channel | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS channels (
      id serial PRIMARY KEY,
      name text NOT NULL,
      description text,
      type text DEFAULT 'group',
      lead_id integer REFERENCES leads(id),
      created_by_user_id integer NOT NULL REFERENCES users(id),
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp,
      discord_webhook_url text,
      discord_channel_id text,
      discord_mirroring_enabled boolean DEFAULT false
    );`);
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel;
  }

  async getChannels(userId?: number, leadId?: number, type?: string): Promise<Channel[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS channels (
      id serial PRIMARY KEY,
      name text NOT NULL,
      description text,
      type text DEFAULT 'group',
      lead_id integer REFERENCES leads(id),
      created_by_user_id integer NOT NULL REFERENCES users(id),
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp,
      discord_webhook_url text,
      discord_channel_id text,
      discord_mirroring_enabled boolean DEFAULT false
    );`);
    const conditions: any[] = [];
    
    if (userId) {
      const userChannels = await db
        .select({ channelId: channelMembers.channelId })
        .from(channelMembers)
        .where(eq(channelMembers.userId, userId));
      
      if (userChannels.length > 0) {
        conditions.push(inArray(channels.id, userChannels.map(uc => uc.channelId)));
      } else {
        return [];
      }
    }
    
    if (leadId) {
      conditions.push(eq(channels.leadId, leadId));
    }
    
    if (type) {
      const t = type as 'direct' | 'group' | 'lead' | 'team';
      conditions.push(eq(channels.type, t));
    }
    
    conditions.push(eq(channels.isActive, true));
    
    let query = db.select().from(channels);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    return await query.orderBy(desc(channels.updatedAt || channels.createdAt));
  }

  async createChannel(insert: InsertChannel): Promise<Channel> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS channels (
      id serial PRIMARY KEY,
      name text NOT NULL,
      description text,
      type text DEFAULT 'group',
      lead_id integer REFERENCES leads(id),
      created_by_user_id integer NOT NULL REFERENCES users(id),
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp,
      discord_webhook_url text,
      discord_channel_id text,
      discord_mirroring_enabled boolean DEFAULT false
    );`);
    const [channel] = await db
      .insert(channels)
      .values(insert)
      .returning();
    return channel;
  }

  async updateChannel(id: number, updateData: Partial<InsertChannel>): Promise<Channel | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS channels (
      id serial PRIMARY KEY,
      name text NOT NULL,
      description text,
      type text DEFAULT 'group',
      lead_id integer REFERENCES leads(id),
      created_by_user_id integer NOT NULL REFERENCES users(id),
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp,
      discord_webhook_url text,
      discord_channel_id text,
      discord_mirroring_enabled boolean DEFAULT false
    );`);
    const [existing] = await db.select().from(channels).where(eq(channels.id, id));
    if (!existing) {
      return undefined;
    }
    const [updated] = await db
      .update(channels)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(channels.id, id))
      .returning();
    return updated;
  }

  // Channel Member functions
  async getChannelMember(channelId: number, userId: number): Promise<ChannelMember | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS channel_members (
      id serial PRIMARY KEY,
      channel_id integer NOT NULL REFERENCES channels(id),
      user_id integer NOT NULL REFERENCES users(id),
      role text DEFAULT 'member',
      last_read_at timestamp,
      joined_at timestamp DEFAULT now() NOT NULL,
      notifications_enabled boolean DEFAULT true
    );`);
    const [member] = await db
      .select()
      .from(channelMembers)
      .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)));
    return member;
  }

  async getChannelMembers(channelId: number): Promise<ChannelMember[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS channel_members (
      id serial PRIMARY KEY,
      channel_id integer NOT NULL REFERENCES channels(id),
      user_id integer NOT NULL REFERENCES users(id),
      role text DEFAULT 'member',
      last_read_at timestamp,
      joined_at timestamp DEFAULT now() NOT NULL,
      notifications_enabled boolean DEFAULT true
    );`);
    return await db
      .select()
      .from(channelMembers)
      .where(eq(channelMembers.channelId, channelId))
      .orderBy(desc(channelMembers.joinedAt));
  }

  async addChannelMember(insert: InsertChannelMember): Promise<ChannelMember> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS channel_members (
      id serial PRIMARY KEY,
      channel_id integer NOT NULL REFERENCES channels(id),
      user_id integer NOT NULL REFERENCES users(id),
      role text DEFAULT 'member',
      last_read_at timestamp,
      joined_at timestamp DEFAULT now() NOT NULL,
      notifications_enabled boolean DEFAULT true
    );`);
    const [member] = await db
      .insert(channelMembers)
      .values(insert)
      .returning();
    return member;
  }

  async updateChannelMember(channelId: number, userId: number, updateData: Partial<InsertChannelMember>): Promise<ChannelMember | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS channel_members (
      id serial PRIMARY KEY,
      channel_id integer NOT NULL REFERENCES channels(id),
      user_id integer NOT NULL REFERENCES users(id),
      role text DEFAULT 'member',
      last_read_at timestamp,
      joined_at timestamp DEFAULT now() NOT NULL,
      notifications_enabled boolean DEFAULT true
    );`);
    const [existing] = await db
      .select()
      .from(channelMembers)
      .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)));
    if (!existing) {
      return undefined;
    }
    const [updated] = await db
      .update(channelMembers)
      .set(updateData)
      .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)))
      .returning();
    return updated;
  }

  async removeChannelMember(channelId: number, userId: number): Promise<boolean> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS channel_members (
      id serial PRIMARY KEY,
      channel_id integer NOT NULL REFERENCES channels(id),
      user_id integer NOT NULL REFERENCES users(id),
      role text DEFAULT 'member',
      last_read_at timestamp,
      joined_at timestamp DEFAULT now() NOT NULL,
      notifications_enabled boolean DEFAULT true
    );`);
    try {
      await db
        .delete(channelMembers)
        .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)));
      return true;
    } catch (error) {
      console.error(`Error removing channel member:`, error);
      return false;
    }
  }

  // Message functions
  async getMessage(id: number): Promise<Message | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS messages (
      id serial PRIMARY KEY,
      channel_id integer NOT NULL REFERENCES channels(id),
      user_id integer NOT NULL REFERENCES users(id),
      content text NOT NULL,
      message_type text DEFAULT 'text',
      file_url text,
      file_name text,
      file_size integer,
      reply_to_message_id integer REFERENCES messages(id),
      is_edited boolean DEFAULT false,
      edited_at timestamp,
      is_deleted boolean DEFAULT false,
      deleted_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessages(channelId: number, limit?: number, offset?: number): Promise<Message[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS messages (
      id serial PRIMARY KEY,
      channel_id integer NOT NULL REFERENCES channels(id),
      user_id integer NOT NULL REFERENCES users(id),
      content text NOT NULL,
      message_type text DEFAULT 'text',
      file_url text,
      file_name text,
      file_size integer,
      reply_to_message_id integer REFERENCES messages(id),
      is_edited boolean DEFAULT false,
      edited_at timestamp,
      is_deleted boolean DEFAULT false,
      deleted_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    let query = db
      .select()
      .from(messages)
      .where(and(eq(messages.channelId, channelId), eq(messages.isDeleted, false)))
      .orderBy(desc(messages.createdAt));
    
    if (limit) {
      query = query.limit(limit) as typeof query;
    }
    
    if (offset) {
      query = query.offset(offset) as typeof query;
    }
    
    return await query;
  }

  async createMessage(insert: InsertMessage): Promise<Message> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS messages (
      id serial PRIMARY KEY,
      channel_id integer NOT NULL REFERENCES channels(id),
      user_id integer NOT NULL REFERENCES users(id),
      content text NOT NULL,
      message_type text DEFAULT 'text',
      file_url text,
      file_name text,
      file_size integer,
      reply_to_message_id integer REFERENCES messages(id),
      is_edited boolean DEFAULT false,
      edited_at timestamp,
      is_deleted boolean DEFAULT false,
      deleted_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    const [message] = await db
      .insert(messages)
      .values(insert)
      .returning();
    return message;
  }

  async updateMessage(id: number, updateData: Partial<InsertMessage>): Promise<Message | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS messages (
      id serial PRIMARY KEY,
      channel_id integer NOT NULL REFERENCES channels(id),
      user_id integer NOT NULL REFERENCES users(id),
      content text NOT NULL,
      message_type text DEFAULT 'text',
      file_url text,
      file_name text,
      file_size integer,
      reply_to_message_id integer REFERENCES messages(id),
      is_edited boolean DEFAULT false,
      edited_at timestamp,
      is_deleted boolean DEFAULT false,
      deleted_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    const [existing] = await db.select().from(messages).where(eq(messages.id, id));
    if (!existing) {
      return undefined;
    }
    const [updated] = await db
      .update(messages)
      .set({
        ...updateData,
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  async deleteMessage(id: number): Promise<boolean> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS messages (
      id serial PRIMARY KEY,
      channel_id integer NOT NULL REFERENCES channels(id),
      user_id integer NOT NULL REFERENCES users(id),
      content text NOT NULL,
      message_type text DEFAULT 'text',
      file_url text,
      file_name text,
      file_size integer,
      reply_to_message_id integer REFERENCES messages(id),
      is_edited boolean DEFAULT false,
      edited_at timestamp,
      is_deleted boolean DEFAULT false,
      deleted_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    try {
      await db
        .update(messages)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
        })
        .where(eq(messages.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting message:`, error);
      return false;
    }
  }

  // Message Reaction functions
  async getMessageReactions(messageId: number): Promise<MessageReaction[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      emoji text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );`);
    return await db
      .select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId))
      .orderBy(desc(messageReactions.createdAt));
  }

  async getMessageReactionsByEmoji(messageId: number, emoji: string): Promise<MessageReaction[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      emoji text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );`);
    return await db
      .select()
      .from(messageReactions)
      .where(and(eq(messageReactions.messageId, messageId), eq(messageReactions.emoji, emoji)))
      .orderBy(desc(messageReactions.createdAt));
  }

  async addMessageReaction(insert: InsertMessageReaction): Promise<MessageReaction> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      emoji text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );`);
    const [reaction] = await db
      .insert(messageReactions)
      .values(insert)
      .returning();
    return reaction;
  }

  async removeMessageReaction(messageId: number, userId: number, emoji: string): Promise<boolean> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      emoji text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );`);
    try {
      await db
        .delete(messageReactions)
        .where(and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        ));
      return true;
    } catch (error) {
      console.error(`Error removing message reaction:`, error);
      return false;
    }
  }

  async getMessageReactionSummary(messageId: number): Promise<Array<{ emoji: string; count: number; userIds: number[] }>> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      emoji text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );`);
    
    const reactions = await db
      .select({
        emoji: messageReactions.emoji,
        userId: messageReactions.userId,
      })
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId))
      .orderBy(desc(messageReactions.createdAt));

    const summary: Record<string, { emoji: string; count: number; userIds: number[] }> = {};
    
    reactions.forEach(reaction => {
      if (!summary[reaction.emoji]) {
        summary[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          userIds: []
        };
      }
      summary[reaction.emoji].count++;
      summary[reaction.emoji].userIds.push(reaction.userId);
    });

    return Object.values(summary);
  }

  // Read Receipt functions
  async getReadReceipts(messageId: number): Promise<MessageReadReceipt[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_read_receipts (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      read_at timestamp DEFAULT now() NOT NULL
    );`);
    return await db
      .select()
      .from(messageReadReceipts)
      .where(eq(messageReadReceipts.messageId, messageId))
      .orderBy(desc(messageReadReceipts.readAt));
  }

  async createReadReceipt(insert: InsertMessageReadReceipt): Promise<MessageReadReceipt> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_read_receipts (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      read_at timestamp DEFAULT now() NOT NULL
    );`);
    const [receipt] = await db
      .insert(messageReadReceipts)
      .values(insert)
      .returning();
    return receipt;
  }

  async markChannelAsRead(channelId: number, userId: number): Promise<void> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_read_receipts (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      read_at timestamp DEFAULT now() NOT NULL
    );`);
    const unreadMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .leftJoin(
        messageReadReceipts,
        and(
          eq(messageReadReceipts.messageId, messages.id),
          eq(messageReadReceipts.userId, userId)
        )
      )
      .where(and(
        eq(messages.channelId, channelId),
        eq(messages.isDeleted, false),
        sql`message_read_receipts.id IS NULL`
      ));

    if (unreadMessages.length > 0) {
      const receipts = unreadMessages.map(msg => ({
        messageId: msg.id,
        userId,
        readAt: new Date()
      }));
      
      await db.insert(messageReadReceipts).values(receipts);
    }

    await this.updateChannelMember(channelId, userId, { lastReadAt: new Date() });
  }

  async getUnreadCount(channelId: number, userId: number): Promise<number> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_read_receipts (
      id serial PRIMARY KEY,
      message_id integer NOT NULL REFERENCES messages(id),
      user_id integer NOT NULL REFERENCES users(id),
      read_at timestamp DEFAULT now() NOT NULL
    );`);
    const result = await db
      .select({ count: sql`count(*)` })
      .from(messages)
      .leftJoin(
        messageReadReceipts,
        and(
          eq(messageReadReceipts.messageId, messages.id),
          eq(messageReadReceipts.userId, userId)
        )
      )
      .where(and(
        eq(messages.channelId, channelId),
        eq(messages.isDeleted, false),
        sql`message_read_receipts.id IS NULL`
      ));
    
    return Number(result[0]?.count) || 0;
  }
}

export const messagingStorage = new MessagingStorage();

// WhatsApp storage functions
export class WhatsAppStorage {
  // WhatsApp Config functions
  async getWhatsAppConfig(phoneNumberId: string): Promise<WhatsappConfig | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS whatsapp_configs (
      id serial PRIMARY KEY,
      phone_number_id text NOT NULL UNIQUE,
      business_account_id text NOT NULL,
      phone_number text NOT NULL UNIQUE,
      display_name text NOT NULL,
      verified_name text,
      quality_rating text,
      webhook_verify_token text NOT NULL,
      access_token text NOT NULL,
      is_active boolean DEFAULT true,
      last_webhook_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    const [config] = await db.select().from(whatsappConfigs).where(eq(whatsappConfigs.phoneNumberId, phoneNumberId));
    return config;
  }

  async getWhatsAppConfigs(): Promise<WhatsappConfig[]> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS whatsapp_configs (
      id serial PRIMARY KEY,
      phone_number_id text NOT NULL UNIQUE,
      business_account_id text NOT NULL,
      phone_number text NOT NULL UNIQUE,
      display_name text NOT NULL,
      verified_name text,
      quality_rating text,
      webhook_verify_token text NOT NULL,
      access_token text NOT NULL,
      is_active boolean DEFAULT true,
      last_webhook_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    return await db.select().from(whatsappConfigs).where(eq(whatsappConfigs.isActive, true));
  }

  async updateUserEncryptionKey(userId: string, keyData: { publicKey: string; keyId?: string; createdAt?: Date }): Promise<void> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS user_encryption_keys (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      public_key text NOT NULL,
      key_id text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    
    const [existing] = await db.select().from(userEncryptionKeys).where(eq(userEncryptionKeys.userId, parseInt(userId)));
    
    if (existing) {
      await db
        .update(userEncryptionKeys)
        .set({
          publicKey: keyData.publicKey,
          keyId: keyData.keyId || existing.keyId,
          updatedAt: new Date(),
        })
        .where(eq(userEncryptionKeys.userId, parseInt(userId)));
    } else {
      await db.insert(userEncryptionKeys).values({
        userId: parseInt(userId),
        publicKey: keyData.publicKey,
        keyId: keyData.keyId,
        createdAt: keyData.createdAt || new Date(),
      });
    }
  }

  async getUserEncryptionKey(userId: string): Promise<UserEncryptionKey | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS user_encryption_keys (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      public_key text NOT NULL,
      key_id text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    
    const [key] = await db.select().from(userEncryptionKeys).where(eq(userEncryptionKeys.userId, parseInt(userId)));
    return key;
  }

  async createWhatsAppConfig(insert: InsertWhatsappConfig): Promise<WhatsappConfig> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS whatsapp_configs (
      id serial PRIMARY KEY,
      phone_number_id text NOT NULL UNIQUE,
      business_account_id text NOT NULL,
      phone_number text NOT NULL UNIQUE,
      display_name text NOT NULL,
      verified_name text,
      quality_rating text,
      webhook_verify_token text NOT NULL,
      access_token text NOT NULL,
      is_active boolean DEFAULT true,
      last_webhook_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    const [config] = await db
      .insert(whatsappConfigs)
      .values(insert)
      .returning();
    return config;
  }

  async updateWhatsAppConfig(phoneNumberId: string, updateData: Partial<InsertWhatsappConfig>): Promise<WhatsappConfig | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS whatsapp_configs (
      id serial PRIMARY KEY,
      phone_number_id text NOT NULL UNIQUE,
      business_account_id text NOT NULL,
      phone_number text NOT NULL UNIQUE,
      display_name text NOT NULL,
      verified_name text,
      quality_rating text,
      webhook_verify_token text NOT NULL,
      access_token text NOT NULL,
      is_active boolean DEFAULT true,
      last_webhook_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    const [existing] = await db.select().from(whatsappConfigs).where(eq(whatsappConfigs.phoneNumberId, phoneNumberId));
    if (!existing) {
      return undefined;
    }
    const [updated] = await db
      .update(whatsappConfigs)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(whatsappConfigs.phoneNumberId, phoneNumberId))
      .returning();
    return updated;
  }

  // WhatsApp Contact functions
  async getWhatsAppContact(phoneNumber: string): Promise<WhatsappContact | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS whatsapp_contacts (
      id serial PRIMARY KEY,
      lead_id integer NOT NULL REFERENCES leads(id),
      phone_number text NOT NULL,
      wa_id text,
      profile_name text,
      about text,
      profile_picture_url text,
      is_blocked boolean DEFAULT false,
      last_message_at timestamp,
      message_count integer DEFAULT 0,
      opt_in_status boolean DEFAULT false,
      opt_in_at timestamp,
      opt_out_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp
    );`);
    const [contact] = await db.select().from(whatsappContacts).where(eq(whatsappContacts.phoneNumber, phoneNumber));
    return contact;
  }

  async getWhatsAppContactByLeadId(leadId: number): Promise<WhatsappContact | undefined> {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS whatsapp_contacts (
      id serial PRIMARY KEY,
      lead_id integer NOT NULL REFERENCES leads(id),
      phone_number text NOT NULL,
      wa_id text,
      profile_name text,
      about text,
      profile_picture_url text,
      is_blocked boolean DEFAULT false,
      last_message_at timestamp,
      message_count integer DEFAULT 0,
      opt_in boolean DEFAULT false,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP
    )`);
    
    const [contact] = await db.select().from(whatsappContacts).where(eq(whatsappContacts.leadId, leadId));
    return contact;
  }
}

export const whatsappStorage = new WhatsAppStorage();
