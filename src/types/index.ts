export interface LeadPayload {
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  status?: string;
  propertyType?: string;
  source?: string;
  notes?: string;
  estimatedValue?: number;
  arv?: number;
  repairCost?: number;
  assignedToUserId?: number;
}

export interface CallPayload {
  leadId: number;
  duration: number;
  outcome: string;
  notes?: string;
  scheduledAt?: Date;
}

export interface TimesheetEntry {
  date: Date;
  description: string;
  activityType: string;
  totalHours: number;
  approved?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  role: string;
}
