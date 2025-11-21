"use client";

import { DashboardLayout } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, RotateCcw, X } from 'lucide-react';

interface LayoutToolbarProps {
  layout: DashboardLayout;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onReset: () => void;
  onCancel?: () => void;
}

export function LayoutToolbar({
  layout,
  onNameChange,
  onSave,
  onReset,
  onCancel,
}: LayoutToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="layout-name">Dashboard Name</Label>
        <Input
          id="layout-name"
          value={layout.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter dashboard name"
        />
      </div>
      
      <div className="flex gap-2">
        <Button onClick={onSave} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Save Layout
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {onCancel && (
        <Button variant="ghost" onClick={onCancel} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      )}
      
      <div className="text-xs text-muted-foreground text-center">
        {layout.widgets.length} widget{layout.widgets.length !== 1 ? 's' : ''} • 
        Last updated: {new Date(layout.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
}