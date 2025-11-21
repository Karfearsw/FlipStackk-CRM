"use client";

import { useMemo } from 'react';
import { DashboardWidget, WidgetType } from '@/types/dashboard';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { DealPipeline } from '@/components/dashboard/deal-pipeline';
import { UpcomingCalls } from '@/components/dashboard/upcoming-calls';
import { SummaryMetrics } from '@/components/dashboard/summary-metrics';
import { LineChartWidget } from '@/components/dashboard/widgets/line-chart-widget';
import { BarChartWidget } from '@/components/dashboard/widgets/bar-chart-widget';
import { PieChartWidget } from '@/components/dashboard/widgets/pie-chart-widget';
import { DataTableWidget } from '@/components/dashboard/widgets/data-table-widget';
import { CustomMetricWidget } from '@/components/dashboard/widgets/custom-metric-widget';
import { Card } from '@/components/ui/card';
import { useApiQuery } from '@/hooks/use-api';
import { UserSearch, Phone, Calendar, FileText, TrendingUp, DollarSign, Target, Users } from 'lucide-react';

interface WidgetRendererProps {
  widget: DashboardWidget;
  onEdit?: (widget: DashboardWidget) => void;
  onDelete?: (widgetId: string) => void;
}

export function WidgetRenderer({ widget, onEdit, onDelete }: WidgetRendererProps) {
  const { data: leads = [] } = useApiQuery<any[]>(['leads'], '/api/leads');
  const { data: calls = [] } = useApiQuery<any[]>(['calls'], '/api/calls');
  const { data: scheduledCalls = [] } = useApiQuery<any[]>(['scheduled-calls'], '/api/scheduled-calls');
  const { data: deals = [] } = useApiQuery<any[]>(['deals'], '/api/deals');

  const getDateRange = (timeRange: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setDate(now.getDate() - 7);
    }
    
    return start;
  };

  const filteredData = useMemo(() => {
    const timeRange = widget.config.timeRange || 'week';
    const startDate = getDateRange(timeRange);
    
    switch (widget.config.dataSource) {
      case 'leads':
        return leads.filter((lead: any) => new Date(lead.createdAt) >= startDate);
      case 'calls':
        return calls.filter((call: any) => new Date(call.createdAt) >= startDate);
      case 'scheduled-calls':
        return scheduledCalls.filter((call: any) => new Date(call.createdAt) >= startDate);
      default:
        return [];
    }
  }, [widget.config, leads, calls, scheduledCalls]);

  const renderWidget = () => {
    switch (widget.type) {
      case 'stats-card':
        return renderStatsCard();
      case 'chart-line':
        return <LineChartWidget widget={widget} data={filteredData} />;
      case 'chart-bar':
        return <BarChartWidget widget={widget} data={filteredData} />;
      case 'chart-pie':
        return <PieChartWidget widget={widget} data={filteredData} />;
      case 'table':
        return <DataTableWidget widget={widget} data={filteredData} />;
      case 'activity-feed':
        return <ActivityFeed />;
      case 'deal-pipeline':
        return <DealPipeline />;
      case 'upcoming-calls':
        return <UpcomingCalls />;
      case 'summary-metrics':
        return <SummaryMetrics />;
      case 'custom-metric':
        return <CustomMetricWidget widget={widget} data={filteredData} />;
      default:
        return (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Unknown widget type: {widget.type}
          </div>
        );
    }
  };

  const renderStatsCard = () => {
    const timeRange = widget.config.timeRange || 'week';
    const startDate = getDateRange(timeRange);
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - 7);

    let title = widget.title;
    let value = 0;
    let currentValue = 0;
    let previousValue = 0;
    let icon = <TrendingUp className="h-5 w-5" />;
    let iconBgColor = 'bg-primary/10';
    let iconColor = 'text-primary';

    switch (widget.config.metric) {
      case 'leads':
        title = 'New Leads';
        value = leads.filter((lead: any) => lead.status === 'new').length;
        currentValue = leads.filter((lead: any) => 
          lead.status === 'new' && new Date(lead.createdAt) >= startDate
        ).length;
        previousValue = leads.filter((lead: any) => 
          lead.status === 'new' && 
          new Date(lead.createdAt) >= previousStartDate && 
          new Date(lead.createdAt) < startDate
        ).length;
        icon = <UserSearch className="h-5 w-5" />;
        break;
      case 'calls':
        title = 'Calls Made';
        value = calls.length;
        currentValue = calls.filter((call: any) => new Date(call.createdAt) >= startDate).length;
        previousValue = calls.filter((call: any) => 
          new Date(call.createdAt) >= previousStartDate && 
          new Date(call.createdAt) < startDate
        ).length;
        icon = <Phone className="h-5 w-5" />;
        iconBgColor = 'bg-blue-100';
        iconColor = 'text-blue-700';
        break;
      case 'appointments':
        title = 'Appointments';
        value = scheduledCalls.filter((call: any) => call.status === 'pending').length;
        currentValue = scheduledCalls.filter((call: any) => 
          call.status === 'pending' && new Date(call.createdAt) >= startDate
        ).length;
        previousValue = scheduledCalls.filter((call: any) => 
          call.status === 'pending' && 
          new Date(call.createdAt) >= previousStartDate && 
          new Date(call.createdAt) < startDate
        ).length;
        icon = <Calendar className="h-5 w-5" />;
        iconBgColor = 'bg-yellow-100';
        iconColor = 'text-yellow-700';
        break;
      case 'deals':
        title = 'Active Deals';
        value = leads.filter((lead: any) => lead.status !== 'dead' && lead.status !== 'new').length;
        currentValue = leads.filter((lead: any) => 
          lead.status !== 'dead' && lead.status !== 'new' && 
          new Date(lead.createdAt) >= startDate
        ).length;
        previousValue = leads.filter((lead: any) => 
          lead.status !== 'dead' && lead.status !== 'new' && 
          new Date(lead.createdAt) >= previousStartDate && 
          new Date(lead.createdAt) < startDate
        ).length;
        icon = <FileText className="h-5 w-5" />;
        iconBgColor = 'bg-green-100';
        iconColor = 'text-green-700';
        break;
      case 'revenue':
        title = 'Revenue';
        value = deals
          .filter((d: any) => d.status === 'closed_won')
          .reduce((sum: number, d: any) => sum + Number(d.value || 0), 0);
        currentValue = value;
        previousValue = 0;
        icon = <DollarSign className="h-5 w-5" />;
        iconBgColor = 'bg-green-100';
        iconColor = 'text-green-700';
        break;
      case 'conversion':
        title = 'Conversion Rate';
        const totalLeads = leads.length;
        const converted = leads.filter((lead: any) => lead.status === 'closed').length;
        value = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;
        currentValue = value;
        previousValue = 0;
        icon = <Target className="h-5 w-5" />;
        iconBgColor = 'bg-purple-100';
        iconColor = 'text-purple-700';
        break;
      case 'customers':
        title = 'Total Customers';
        value = leads.filter((lead: any) => lead.status === 'closed').length;
        currentValue = value;
        previousValue = 0;
        icon = <Users className="h-5 w-5" />;
        iconBgColor = 'bg-indigo-100';
        iconColor = 'text-indigo-700';
        break;
      default:
        title = widget.title || 'Custom Metric';
        value = 0;
        currentValue = 0;
        previousValue = 0;
    }

    return (
      <StatsCard
        title={title}
        value={value}
        icon={icon}
        currentValue={currentValue}
        previousValue={previousValue}
        iconBgColor={iconBgColor}
        iconColor={iconColor}
      />
    );
  };

  return (
    <div className="h-full">
      {renderWidget()}
    </div>
  );
}