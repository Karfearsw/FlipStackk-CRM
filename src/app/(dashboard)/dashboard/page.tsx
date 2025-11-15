"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiGet } from "@/hooks/use-api";
import { 
  UserSearch, 
  Phone, 
  Clock, 
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Activity
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => apiGet<any[]>("/api/leads"),
  });

  const { data: calls = [] } = useQuery({
    queryKey: ["calls"],
    queryFn: () => apiGet<any[]>("/api/calls"),
  });

  const { data: scheduledCalls = [] } = useQuery({
    queryKey: ["scheduled-calls"],
    queryFn: () => apiGet<any[]>("/api/scheduled-calls"),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => apiGet<any[]>("/api/activities").then(data => data.slice(0, 10)),
  });

  // Calculate metrics
  const newLeads = leads.filter((l: any) => l.status === "new").length;
  const qualifiedLeads = leads.filter((l: any) => l.status === "qualified").length;
  const todaysCalls = calls.filter((c: any) => {
    const callDate = new Date(c.createdAt);
    const today = new Date();
    return callDate.toDateString() === today.toDateString();
  }).length;
  const upcomingCalls = scheduledCalls.filter((c: any) => 
    new Date(c.scheduledTime) > new Date()
  ).length;

  const statCards = [
    {
      title: "Total Leads",
      value: leads.length,
      change: "+12%",
      icon: UserSearch,
      color: "text-blue-600",
    },
    {
      title: "Today's Calls",
      value: todaysCalls,
      change: `${upcomingCalls} scheduled`,
      icon: Phone,
      color: "text-green-600",
    },
    {
      title: "Qualified Leads",
      value: qualifiedLeads,
      change: `${newLeads} new`,
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Conversion Rate",
      value: leads.length > 0 ? `${Math.round((qualifiedLeads / leads.length) * 100)}%` : "0%",
      change: "This month",
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/leads">
                <Button className="w-full justify-start" variant="outline">
                  <UserSearch className="mr-2 h-4 w-4" />
                  Add New Lead
                </Button>
              </Link>
              <Link href="/calls">
                <Button className="w-full justify-start" variant="outline">
                  <Phone className="mr-2 h-4 w-4" />
                  Log a Call
                </Button>
              </Link>
              <Link href="/calls">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Call
                </Button>
              </Link>
              <Link href="/timesheets">
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Log Time
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Scheduled Calls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Upcoming Calls</span>
                <Link href="/calls">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledCalls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No scheduled calls
                </p>
              ) : (
                <div className="space-y-3">
                  {scheduledCalls.slice(0, 5).map((call: any) => (
                    <div key={call.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Lead #{call.leadId}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(call.scheduledTime), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity: any, index: number) => (
                  <div key={activity.id || index}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activity.actionType}
                      </Badge>
                    </div>
                    {index < activities.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["new", "contacted", "qualified", "unqualified", "closed"].map((status) => {
              const count = leads.filter((l: any) => l.status === status).length;
              const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{status}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
