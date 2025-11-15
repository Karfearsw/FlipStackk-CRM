"use client";

import { StatsCard } from "@/components/dashboard/stats-card";
import { SummaryMetrics } from "@/components/dashboard/summary-metrics";
import { DealPipeline } from "@/components/dashboard/deal-pipeline";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UpcomingCalls } from "@/components/dashboard/upcoming-calls";
import { useApiQuery } from "@/hooks/use-api";
import { UserSearch, Phone, Calendar, FileText } from "lucide-react";

interface Lead {
  id: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface Call {
  id: number;
  createdAt: string;
}

interface ScheduledCall {
  id: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: leads = [] } = useApiQuery<Lead[]>(
    ["leads"],
    "/api/leads"
  );
  
  const { data: calls = [] } = useApiQuery<Call[]>(
    ["calls"],
    "/api/calls"
  );
  
  const { data: scheduledCalls = [] } = useApiQuery<ScheduledCall[]>(
    ["scheduled-calls"],
    "/api/scheduled-calls"
  );
  
  const getDateRange = (daysAgo: number) => {
    const start = new Date();
    start.setDate(start.getDate() - daysAgo);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const oneWeekAgo = getDateRange(7);
  const twoWeeksAgo = getDateRange(14);
  const oneDayAgo = getDateRange(1);
  const twoDaysAgo = getDateRange(2);
  const oneMonthAgo = getDateRange(30);
  const twoMonthsAgo = getDateRange(60);

  const newLeadsCount = leads.filter((lead) => lead.status === "new").length;
  const newLeadsLastWeek = leads.filter(
    (lead) => lead.status === "new" && 
    new Date(lead.createdAt) >= oneWeekAgo
  ).length;
  const newLeadsPreviousWeek = leads.filter(
    (lead) => lead.status === "new" && 
    new Date(lead.createdAt) >= twoWeeksAgo && 
    new Date(lead.createdAt) < oneWeekAgo
  ).length;

  const callsMadeCount = calls.length;
  const callsMadeYesterday = calls.filter(
    (call) => new Date(call.createdAt) >= oneDayAgo
  ).length;
  const callsMadeTwoDaysAgo = calls.filter(
    (call) => new Date(call.createdAt) >= twoDaysAgo && 
    new Date(call.createdAt) < oneDayAgo
  ).length;

  const appointmentsCount = scheduledCalls.filter(
    (call) => call.status === "pending"
  ).length;
  const appointmentsLastWeek = scheduledCalls.filter(
    (call) => call.status === "pending" && 
    new Date(call.createdAt) >= oneWeekAgo
  ).length;
  const appointmentsPreviousWeek = scheduledCalls.filter(
    (call) => call.status === "pending" && 
    new Date(call.createdAt) >= twoWeeksAgo && 
    new Date(call.createdAt) < oneWeekAgo
  ).length;

  const activeDealsCount = leads.filter(
    (lead) => lead.status !== "dead" && lead.status !== "new"
  ).length;
  const activeDealsLastMonth = leads.filter(
    (lead) => lead.status !== "dead" && lead.status !== "new" && 
    new Date(lead.createdAt) >= oneMonthAgo
  ).length;
  const activeDealsPreviousMonth = leads.filter(
    (lead) => lead.status !== "dead" && lead.status !== "new" && 
    new Date(lead.createdAt) >= twoMonthsAgo && 
    new Date(lead.createdAt) < oneMonthAgo
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your real estate deals and activities</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="New Leads" 
          value={newLeadsCount}
          icon={<UserSearch className="h-5 w-5" />}
          currentValue={newLeadsLastWeek}
          previousValue={newLeadsPreviousWeek}
        />
        
        <StatsCard 
          title="Calls Made" 
          value={callsMadeCount}
          icon={<Phone className="h-5 w-5" />}
          currentValue={callsMadeYesterday}
          previousValue={callsMadeTwoDaysAgo}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-700"
        />
        
        <StatsCard 
          title="Appointments" 
          value={appointmentsCount}
          icon={<Calendar className="h-5 w-5" />}
          currentValue={appointmentsLastWeek}
          previousValue={appointmentsPreviousWeek}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-700"
        />
        
        <StatsCard 
          title="Active Deals" 
          value={activeDealsCount}
          icon={<FileText className="h-5 w-5" />}
          currentValue={activeDealsLastMonth}
          previousValue={activeDealsPreviousMonth}
          iconBgColor="bg-green-100"
          iconColor="text-green-700"
        />
      </div>
      
      <SummaryMetrics />
      
      <DealPipeline />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ActivityFeed />
        <UpcomingCalls />
      </div>
    </div>
  );
}
