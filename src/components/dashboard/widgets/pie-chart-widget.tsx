"use client";

import { DashboardWidget } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PieChartWidgetProps {
  widget: DashboardWidget;
  data: any[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export function PieChartWidget({ widget, data }: PieChartWidgetProps) {
  const chartData = generatePieChartData(data, widget.config);

  function generatePieChartData(rawData: any[], config: any) {
    const items = rawData || [];
    // Group by status or source when status absent
    const groups: Record<string, number> = {};
    items.forEach((it: any) => {
      const key = (it.status || it.source || 'unknown') as string;
      groups[key] = (groups[key] || 0) + 1;
    });
    const keys = Object.keys(groups);
    return keys.map((k, i) => ({ name: k, value: groups[k], color: COLORS[i % COLORS.length] }));
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            {widget.config.showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}