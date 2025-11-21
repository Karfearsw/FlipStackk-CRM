"use client";

import { DashboardWidget } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Calculator } from 'lucide-react';
import { useState } from 'react';

interface CustomMetricWidgetProps {
  widget: DashboardWidget;
  data: any[];
}

export function CustomMetricWidget({ widget, data }: CustomMetricWidgetProps) {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [formula, setFormula] = useState((widget.config as any).formula || 'value * 100');
  const [inputValue, setInputValue] = useState((widget.config as any).inputValue || '50');

  const calculateMetric = () => {
    try {
      // Simple formula calculator (in production, use a proper expression evaluator)
      const value = parseFloat(inputValue) || 0;
      let result = 0;
      
      if (formula.includes('*')) {
        const parts = formula.split('*');
        result = value * (parseFloat(parts[1]) || 1);
      } else if (formula.includes('/')) {
        const parts = formula.split('/');
        result = value / (parseFloat(parts[1]) || 1);
      } else if (formula.includes('+')) {
        const parts = formula.split('+');
        result = value + (parseFloat(parts[1]) || 0);
      } else if (formula.includes('-')) {
        const parts = formula.split('-');
        result = value - (parseFloat(parts[1]) || 0);
      } else {
        result = value;
      }
      
      return result.toFixed(2);
    } catch (error) {
      return '0.00';
    }
  };

  if (isConfiguring) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Custom Metric Configuration
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfiguring(false)}
            >
              Done
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="formula">Formula</Label>
            <Input
              id="formula"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="value * 100"
            />
          </div>
          <div>
            <Label htmlFor="input">Input Value</Label>
            <Input
              id="input"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="50"
            />
          </div>
          <div>
            <Label>Result</Label>
            <div className="text-2xl font-bold text-primary">
              {calculateMetric()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {widget.title || 'Custom Metric'}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfiguring(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Calculator className="h-8 w-8 text-primary" />
          <div>
            <div className="text-2xl font-bold">{calculateMetric()}</div>
            <div className="text-sm text-muted-foreground">{formula}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}