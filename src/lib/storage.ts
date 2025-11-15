import { 
  users, 
  leads,
  calls,
  scheduledCalls,
  teamMembers,
  activities,
  timesheets,
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
  InsertTimesheet
} from "@/db/schema";
import { db } from "@/lib/db";
import { eq, and, desc, asc, like, or, inArray } from "drizzle-orm";
import { generateLeadId, extractLeadNumber, getCurrentYearPrefix } from "@/lib/utils/lead-utils";

export interface LeadFilters {
  status?: string[];
  search?: string;
  assignedToUserId?: number;
  createdByUserId?: number;
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

export class Storage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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
}

export const storage = new Storage();
