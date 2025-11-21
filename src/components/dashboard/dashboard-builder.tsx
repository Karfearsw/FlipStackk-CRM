"use client";

import { useState } from 'react';
import { DashboardWidget, DashboardLayout, WIDGET_TEMPLATES } from '@/types/dashboard';
import { WidgetRenderer } from '@/components/dashboard/widget-renderer';
import { WidgetLibrary } from '@/components/dashboard/widget-library';
import { LayoutToolbar } from '@/components/dashboard/layout-toolbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Save, RotateCcw, Eye, EyeOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardBuilderProps {
  initialLayout?: DashboardLayout;
  onSave?: (layout: DashboardLayout) => void;
  onCancel?: () => void;
}

export function DashboardBuilder({ initialLayout, onSave, onCancel }: DashboardBuilderProps) {
  const [layout, setLayout] = useState<DashboardLayout>(
    initialLayout || {
      id: 'custom-' + Date.now(),
      name: 'Custom Dashboard',
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { toast } = useToast();

  const handleWidgetAdd = (template: any) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: template.type,
      title: template.name,
      position: { x: 0, y: 0 },
      size: template.defaultSize,
      config: template.defaultConfig,
    };
    
    setLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updatedAt: new Date().toISOString(),
    }));
    
    toast({
      title: 'Widget added',
      description: `${template.name} has been added to your dashboard.`,
    });
  };

  const handleWidgetUpdate = (widgetId: string, updates: Partial<DashboardWidget>) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleWidgetDelete = (widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date().toISOString(),
    }));
    
    toast({
      title: 'Widget removed',
      description: 'The widget has been removed from your dashboard.',
    });
  };

  const handleLayoutSave = () => {
    if (layout.widgets.length === 0) {
      toast({
        title: 'Cannot save empty dashboard',
        description: 'Please add at least one widget before saving.',
        variant: 'destructive',
      });
      return;
    }
    
    onSave?.(layout);
    toast({
      title: 'Dashboard saved',
      description: 'Your custom dashboard has been saved successfully.',
    });
  };

  const handleResetLayout = () => {
    setLayout(prev => ({
      ...prev,
      widgets: [],
      updatedAt: new Date().toISOString(),
    }));
    
    toast({
      title: 'Layout reset',
      description: 'All widgets have been removed from the dashboard.',
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Dashboard Builder</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        
        <LayoutToolbar
          layout={layout}
          onNameChange={(name) => setLayout(prev => ({ ...prev, name }))}
          onSave={handleLayoutSave}
          onReset={handleResetLayout}
          onCancel={onCancel}
        />
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsLibraryOpen(!isLibraryOpen)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isLibraryOpen ? 'Hide Library' : 'Add Widget'}
        </Button>
        
        {isLibraryOpen && (
          <WidgetLibrary onWidgetAdd={handleWidgetAdd} />
        )}
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Current Widgets ({layout.widgets.length})
          </h3>
          
          {layout.widgets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No widgets added yet. Click "Add Widget" to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {layout.widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="p-3 bg-background rounded-lg border text-sm group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{widget.title}</div>
                      <div className="text-muted-foreground text-xs">
                        {widget.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => handleWidgetDelete(widget.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Canvas */}
      <div className="flex-1 overflow-auto p-6">
        <div className="min-h-full">
          {isPreviewMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {layout.widgets.map((widget) => (
                <WidgetRenderer
                  key={widget.id}
                  widget={widget}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {layout.widgets.map((widget) => (
                <div key={widget.id} className="relative group">
                  <WidgetRenderer widget={widget} />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleWidgetDelete(widget.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {layout.widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Start Building Your Dashboard</h3>
            <p className="text-center max-w-md">
              Add widgets from the sidebar to create your custom dashboard layout.
              You can add charts, metrics, tables, and more to visualize your data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}