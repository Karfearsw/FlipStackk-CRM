'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Mail, 
  MessageSquare,
  Calendar,
  Download,
  Filter,
  Crosshair
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const campaignData = [
  { name: 'Jan', leads: 120, conversions: 18, revenue: 125000 },
  { name: 'Feb', leads: 150, conversions: 25, revenue: 185000 },
  { name: 'Mar', leads: 180, conversions: 32, revenue: 240000 },
  { name: 'Apr', leads: 165, conversions: 28, revenue: 210000 },
  { name: 'May', leads: 200, conversions: 38, revenue: 285000 },
  { name: 'Jun', leads: 220, conversions: 42, revenue: 320000 }
];

const channelData = [
  { name: 'Email', value: 45, color: '#0066cc' },
  { name: 'WhatsApp', value: 30, color: '#25D366' },
  { name: 'SMS', value: 15, color: '#FF6B35' },
  { name: 'Direct', value: 10, color: '#8B5CF6' }
];

const conversionFunnelData = [
  { stage: 'Visitors', value: 10000, percentage: 100 },
  { stage: 'Leads', value: 1200, percentage: 12 },
  { stage: 'Qualified', value: 480, percentage: 4.8 },
  { stage: 'Customers', value: 144, percentage: 1.44 }
];

export function CampaignAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedChannel, setSelectedChannel] = useState('all');

  const metrics = {
    totalLeads: 1247,
    totalConversions: 186,
    conversionRate: 14.9,
    revenue: 285000,
    avgLeadValue: 228,
    costPerLead: 45,
    roi: 4.2
  };

  const topCampaigns = [
    { name: 'Property Evaluation Campaign', leads: 342, conversions: 51, rate: 14.9, revenue: 153000 },
    { name: 'Seller Nurture Sequence', leads: 298, conversions: 42, rate: 14.1, revenue: 126000 },
    { name: 'First-Time Buyer Guide', leads: 267, conversions: 38, rate: 14.2, revenue: 114000 },
    { name: 'Market Update Newsletter', leads: 234, conversions: 31, rate: 13.2, revenue: 93000 },
    { name: 'Referral Program', leads: 189, conversions: 24, rate: 12.7, revenue: 72000 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Campaign Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track performance and optimize your marketing campaigns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads.toLocaleString()}</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+12.5%</span>
              <span className="text-xs text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Crosshair className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalConversions}</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+8.3%</span>
              <span className="text-xs text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <div className="flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-xs text-red-500">-2.1%</span>
              <span className="text-xs text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.revenue / 1000).toFixed(0)}K</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+18.7%</span>
              <span className="text-xs text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Generation Trend</CardTitle>
            <CardDescription>Monthly leads and conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="leads" stackId="1" stroke="#0066cc" fill="#0066cc" fillOpacity={0.6} />
                <Area type="monotone" dataKey="conversions" stackId="2" stroke="#25D366" fill="#25D366" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
            <CardDescription>Lead distribution by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Lead journey from visitors to customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionFunnelData.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <span className="text-sm text-muted-foreground">
                    {stage.value.toLocaleString()} ({stage.percentage}%)
                  </span>
                </div>
                <Progress value={stage.percentage} className="h-2" />
                {index < conversionFunnelData.length - 1 && (
                  <div className="text-center text-xs text-muted-foreground">
                    ↓ {((conversionFunnelData[index + 1].percentage / stage.percentage) * 100).toFixed(1)}% conversion
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
          <CardDescription>Campaigns ranked by conversion rate and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCampaigns.map((campaign, index) => (
              <div key={campaign.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.leads} leads → {campaign.conversions} conversions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{campaign.rate}% conversion</p>
                  <p className="text-sm text-muted-foreground">
                    ${campaign.revenue.toLocaleString()} revenue
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Average Lead Value</CardTitle>
            <CardDescription>Value per converted lead</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${metrics.avgLeadValue}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+5.2%</span>
              <span className="text-sm text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Per Lead</CardTitle>
            <CardDescription>Marketing spend efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${metrics.costPerLead}</div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">-8.1%</span>
              <span className="text-sm text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Return on Investment</CardTitle>
            <CardDescription>Marketing ROI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.roi}x</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+15.3%</span>
              <span className="text-sm text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}