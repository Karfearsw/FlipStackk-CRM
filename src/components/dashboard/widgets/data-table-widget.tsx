"use client";

import { DashboardWidget } from '@/types/dashboard';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableWidgetProps {
  widget: DashboardWidget;
  data: any[];
}

export function DataTableWidget({ widget, data }: DataTableWidgetProps) {
  const tableData = generateTableData(data, widget.config);

  function generateTableData(rawData: any[], config: any) {
    return (rawData || []).map((item: any) => {
      const created = item.createdAt || item.scheduledTime || item.updatedAt || new Date();
      const createdStr = typeof created === 'string' ? created : format(new Date(created), 'yyyy-MM-dd');
      const valueNum = item.value ?? item.estimatedValue ?? item.arv ?? item.repairCost;
      const valueStr = typeof valueNum === 'number' ? `$${valueNum.toLocaleString()}` : (typeof valueNum === 'string' ? valueNum : '');
      return {
        id: item.id,
        name: item.ownerName ?? item.name ?? (item.title ? item.title : `#${item.id}`),
        email: item.ownerEmail ?? item.email ?? '',
        status: item.status ?? 'unknown',
        createdAt: createdStr,
        value: valueStr,
      };
    });
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      qualified: 'bg-yellow-100 text-yellow-800',
      proposal: 'bg-purple-100 text-purple-800',
      closed: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{getStatusBadge(row.status)}</TableCell>
                <TableCell>{row.createdAt}</TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}