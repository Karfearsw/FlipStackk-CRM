"use client";

import { DashboardWidget } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartWidgetProps {
  widget: DashboardWidget;
  data: any[];
}

export function LineChartWidget({ widget, data }: LineChartWidgetProps) {
  const chartData = generateChartData(data, widget.config);

  function generateChartData(rawData: any[], config: any) {
    const items = rawData || [];
    const buckets: Record<string, number> = {};
    const now = new Date();
    const range = config.timeRange === 'today' ? 24 : config.timeRange === 'week' ? 7 : config.timeRange === 'month' ? 30 : 12;
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now);
      if (config.timeRange === 'today') d.setHours(d.getHours() - i);
      else d.setDate(d.getDate() - i);
      const key = config.timeRange === 'today' ? `${d.getHours()}:00` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets[key] = 0;
    }
    items.forEach((it: any) => {
      const created = new Date(it.createdAt || it.scheduledTime || it.updatedAt || now);
      const key = config.timeRange === 'today' ? `${created.getHours()}:00` : created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in buckets) buckets[key] += 1;
    });
    return Object.keys(buckets).map((k) => ({ name: k, value: buckets[k], previous: 0 }));
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            {widget.config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {widget.config.showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Current"
            />
            <Line 
              type="monotone" 
              dataKey="previous" 
              stroke="#94a3b8" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Previous"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}