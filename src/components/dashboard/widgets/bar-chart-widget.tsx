"use client";

import { DashboardWidget } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartWidgetProps {
  widget: DashboardWidget;
  data: any[];
}

export function BarChartWidget({ widget, data }: BarChartWidgetProps) {
  const chartData = generateBarChartData(data, widget.config);

  function generateBarChartData(rawData: any[], config: any) {
    const items = rawData || [];
    // Derive categories by status/source
    const groups: Record<string, number> = {};
    items.forEach((it: any) => {
      const key = (it.status || it.source || 'unknown') as string;
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.keys(groups).map((k) => ({ name: k, current: groups[k], previous: 0 }));
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {widget.config.showLegend && <Legend />}
            <Bar dataKey="current" fill="#3b82f6" name="Current" />
            <Bar dataKey="previous" fill="#94a3b8" name="Previous" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}