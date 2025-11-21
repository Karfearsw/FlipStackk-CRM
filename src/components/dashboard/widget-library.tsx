"use client";

import { WIDGET_TEMPLATES } from '@/types/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, LineChart, BarChart3, PieChart, Table, Activity, GitBranch, PhoneCall, BarChart4, Settings } from 'lucide-react';

const iconMap = {
  TrendingUp,
  LineChart,
  BarChart3,
  PieChart,
  Table,
  Activity,
  GitBranch: GitBranch,
  PhoneCall,
  BarChart4,
  Settings,
};

interface WidgetLibraryProps {
  onWidgetAdd: (template: any) => void;
}

export function WidgetLibrary({ onWidgetAdd }: WidgetLibraryProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Available Widgets</h3>
        </div>
        
        <div className="space-y-2">
          {WIDGET_TEMPLATES.map((template) => {
            const Icon = iconMap[template.icon as keyof typeof iconMap] || Settings;
            
            return (
              <Button
                key={template.type}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => onWidgetAdd(template)}
              >
                <Icon className="h-4 w-4 mr-3 text-primary" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {template.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Click to add widgets to your dashboard
        </div>
      </CardContent>
    </Card>
  );
}