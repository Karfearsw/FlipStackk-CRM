"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/types/dashboard';
import { WidgetRenderer } from '@/components/dashboard/widget-renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Eye, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function CustomDashboardsPage() {
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<DashboardLayout | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Load saved layouts from localStorage
    const savedLayouts = localStorage.getItem('customDashboards');
    if (savedLayouts) {
      setLayouts(JSON.parse(savedLayouts));
    }
  }, []);

  const handleDeleteLayout = (layoutId: string) => {
    const updatedLayouts = layouts.filter(layout => layout.id !== layoutId);
    setLayouts(updatedLayouts);
    localStorage.setItem('customDashboards', JSON.stringify(updatedLayouts));
    
    if (selectedLayout?.id === layoutId) {
      setSelectedLayout(null);
    }
    
    toast({
      title: 'Dashboard deleted',
      description: 'The dashboard has been removed successfully.',
    });
  };

  const handleViewLayout = (layout: DashboardLayout) => {
    setSelectedLayout(layout);
  };

  if (selectedLayout) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setSelectedLayout(null)} className="mb-4">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Dashboards
            </Button>
            <h1 className="text-2xl font-bold">{selectedLayout.name}</h1>
            <p className="text-muted-foreground">
              Created on {new Date(selectedLayout.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard-builder')}>
              <Plus className="h-4 w-4 mr-2" />
              New Dashboard
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedLayout.widgets.map((widget) => (
            <WidgetRenderer key={widget.id} widget={widget} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Dashboards</h1>
          <p className="text-muted-foreground">
            Manage your personalized dashboard layouts
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard-builder')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Dashboard
        </Button>
      </div>
      
      {layouts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Custom Dashboards</h3>
            <p className="text-muted-foreground mb-6">
              Create your first custom dashboard to visualize your data exactly how you want it.
            </p>
            <Button onClick={() => router.push('/dashboard-builder')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {layouts.map((layout) => (
            <Card key={layout.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{layout.name}</CardTitle>
                    <CardDescription>
                      {layout.widgets.length} widget{layout.widgets.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewLayout(layout)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard-builder?edit=${layout.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLayout(layout.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(layout.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {new Date(layout.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {layout.widgets.slice(0, 3).map((widget) => (
                      <span
                        key={widget.id}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {widget.title}
                      </span>
                    ))}
                    {layout.widgets.length > 3 && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                        +{layout.widgets.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}