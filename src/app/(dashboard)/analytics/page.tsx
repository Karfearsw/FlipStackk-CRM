"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiGet } from "@/hooks/use-api";
import { TrendingUp, Phone, Users, DollarSign } from "lucide-react";

export default function AnalyticsPage() {
  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => apiGet<any[]>("/api/leads"),
  });

  const { data: calls = [] } = useQuery({
    queryKey: ["calls"],
    queryFn: () => apiGet<any[]>("/api/calls"),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: () => apiGet<any[]>("/api/deals"),
  });

  const dealsWon = deals.filter((d) => d.status === "closed_won");
  const dealConversionRate = deals.length > 0 ? (dealsWon.length / deals.length) * 100 : 0;
  const averageDealSize = deals.length > 0 ? deals.reduce((sum: number, d: any) => sum + Number(d.value), 0) / deals.length : 0;
  const salesVelocity = deals.length > 0
    ? deals.reduce((sum: number, d: any) => {
        const prob = Number(d.probability) / 100;
        return sum + Number(d.value) * prob;
      }, 0)
    : 0;

  const leadsByStatus = leads.reduce((acc: any, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  const leadsByType = leads.reduce((acc: any, lead) => {
    acc[lead.propertyType] = (acc[lead.propertyType] || 0) + 1;
    return acc;
  }, {});

  const conversionRate = leads.length > 0
    ? ((leadsByStatus["closed"] || 0) / leads.length) * 100
    : 0;

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Performance metrics and insights
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calls.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadsByStatus["qualified"] || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(leadsByStatus).map(([status, count]: [string, any]) => {
              const percentage = (count / leads.length) * 100;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{status}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Property Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Property Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(leadsByType).map(([type, count]: [string, any]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm capitalize">{type.replace("-", " ")}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Deal Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deal Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealConversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageDealSize.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Velocity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${`${salesVelocity.toFixed(0)}`}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
