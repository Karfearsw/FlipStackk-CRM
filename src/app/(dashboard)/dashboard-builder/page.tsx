"use client";

import { useState } from 'react';
import { DashboardBuilder } from '@/components/dashboard/dashboard-builder';
import { DashboardLayout } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function DashboardBuilderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isBuilding, setIsBuilding] = useState(false);

  const handleSaveLayout = (layout: DashboardLayout) => {
    // Save to localStorage for now (in production, save to database)
    const savedLayouts = JSON.parse(localStorage.getItem('customDashboards') || '[]');
    const updatedLayouts = [...savedLayouts, layout];
    localStorage.setItem('customDashboards', JSON.stringify(updatedLayouts));
    
    toast({
      title: 'Dashboard saved',
      description: 'Your custom dashboard has been saved successfully.',
    });
    
    router.push('/dashboard/custom');
  };

  const handleCancel = () => {
    router.back();
  };

  if (!isBuilding) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">📊</div>
              <h1 className="text-3xl font-bold">Custom Dashboard Builder</h1>
              <p className="text-lg text-muted-foreground">
                Create personalized dashboards with drag-and-drop widgets. 
                Choose from charts, metrics, tables, and more to visualize your data exactly how you want it.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Drag & Drop Interface</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Multiple Widget Types</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Real-time Data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Customizable Layouts</span>
                  </div>
                </div>
                
                <Button size="lg" onClick={() => setIsBuilding(true)}>
                  <Plus className="h-5 w-5 mr-2" />
                  Start Building
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <DashboardBuilder
        onSave={handleSaveLayout}
        onCancel={handleCancel}
      />
    </div>
  );
}