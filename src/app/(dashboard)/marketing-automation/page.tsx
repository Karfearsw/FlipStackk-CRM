'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  BarChart3, 
  Mail, 
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Target,
  Workflow,
  X,
  Info
} from 'lucide-react';
import { MarketingWorkflow, MarketingForm, AutomationStats } from '@/types/marketing';

export default function MarketingAutomationPage() {
  const [workflows, setWorkflows] = useState<MarketingWorkflow[]>([]);
  const [forms, setForms] = useState<MarketingForm[]>([]);
  const [stats, setStats] = useState<AutomationStats>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalLeads: 0,
    convertedLeads: 0,
    emailSent: 0,
    whatsappSent: 0,
    avgConversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrainingBar, setShowTrainingBar] = useState(true);

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const fetchMarketingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch workflows
      const workflowsResponse = await fetch('/api/marketing-automation?type=workflows');
      if (!workflowsResponse.ok) {
        throw new Error(`Failed to fetch workflows: ${workflowsResponse.statusText}`);
      }
      const workflowsData = await workflowsResponse.json();
      setWorkflows(workflowsData.data || []);

      // Fetch forms
      const formsResponse = await fetch('/api/marketing-automation?type=forms');
      if (!formsResponse.ok) {
        throw new Error(`Failed to fetch forms: ${formsResponse.statusText}`);
      }
      const formsData = await formsResponse.json();
      setForms(formsData.data || []);

      // Fetch analytics
      const analyticsResponse = await fetch('/api/marketing-automation?type=analytics');
      if (!analyticsResponse.ok) {
        throw new Error(`Failed to fetch analytics: ${analyticsResponse.statusText}`);
      }
      const analyticsData = await analyticsResponse.json();
      const analytics = analyticsData.data;
      
      if (analytics) {
        setStats({
          totalWorkflows: analytics.workflows?.total || 0,
          activeWorkflows: analytics.workflows?.active || 0,
          totalLeads: analytics.conversions?.totalLeads || 0,
          convertedLeads: analytics.conversions?.totalConversions || 0,
          emailSent: analytics.emails?.totalSent || 0,
          whatsappSent: analytics.whatsapp?.totalSent || 0,
          avgConversionRate: analytics.conversions?.totalLeads > 0 
            ? Math.round((analytics.conversions.totalConversions / analytics.conversions.totalLeads) * 100 * 10) / 10
            : 0
        });
      }

    } catch (error) {
      console.error('Error fetching marketing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch marketing data');
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflowStatus = async (workflowId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const response = await fetch(`/api/marketing-automation?type=workflows&id=${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          updatedAt: new Date()
        })
      });

      if (response.ok) {
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId ? { ...w, status: newStatus as any } : w
        ));
      }
    } catch (error) {
      console.error('Error toggling workflow status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_email': return <Mail className="h-4 w-4" />;
      case 'send_whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'create_task': return <Target className="h-4 w-4" />;
      case 'wait': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-96 bg-gray-200 animate-pulse rounded"></div>
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>
                ))}
              </div>
              <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <div className="mb-4">
            <div className="mx-auto h-12 w-12 text-red-500 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchMarketingData}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Training Dismiss Bar */}
      {showTrainingBar && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Getting Started with Marketing Automation</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Create workflows to automatically engage leads, send personalized messages, and track conversions. 
                  Start by creating your first workflow or lead capture form.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTrainingBar(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Automation</h1>
        <p className="text-muted-foreground">
          Create and manage automated marketing workflows to engage leads and drive conversions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeWorkflows} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.convertedLeads} converted
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailSent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.whatsappSent} WhatsApp
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgConversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average across workflows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="forms">Lead Forms</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </div>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <CardDescription>{workflow.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleWorkflowStatus(workflow.id, workflow.status)}
                      >
                        {workflow.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Trigger</h4>
                      <Badge variant="outline">{workflow.triggerType}</Badge>
                      {workflow.triggerSource && (
                        <span className="text-sm text-muted-foreground ml-2">
                          Source: {workflow.triggerSource}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Actions ({workflow.actions.length})</h4>
                      <div className="space-y-2">
                        {workflow.actions.map((action, index) => (
                          <div key={action.id} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{index + 1}.</span>
                            {getActionIcon(action.type)}
                            <span className="capitalize">{action.type.replace('_', ' ')}</span>
                            {action.delay && (
                              <Badge variant="secondary" className="ml-auto">
                                +{Math.round(action.delay / 1000 / 60)}min
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {workflows.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Workflow className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Workflows Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Marketing automation workflows help you engage leads automatically. 
                    Create your first workflow to start nurturing leads with personalized messages.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Send welcome emails to new leads</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Follow up with WhatsApp messages</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Schedule reminders and tasks</span>
                    </div>
                  </div>
                  <Button size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Workflow
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id}>
                <CardHeader>
                  <CardTitle className="text-base">{form.name}</CardTitle>
                  <CardDescription>{form.settings.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Fields ({form.fields.length})</h4>
                      <div className="flex flex-wrap gap-1">
                        {form.fields.map((field) => (
                          <Badge key={field.id} variant="outline" className="text-xs">
                            {field.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Connected Workflows</h4>
                      <div className="text-sm text-muted-foreground">
                        {form.workflows.length > 0 
                          ? `${form.workflows.length} workflow(s)` 
                          : 'No workflows connected'
                        }
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {forms.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="text-center py-12">
                  <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Lead Forms Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Lead capture forms help you collect information from potential customers. 
                    Create forms to gather contact details, property information, and preferences.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Collect contact information</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Qualify leads automatically</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Connect to automation workflows</span>
                    </div>
                  </div>
                  <Button size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Form
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {(stats.totalWorkflows === 0 && stats.totalLeads === 0) ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Analytics Data Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Analytics will appear here once you start using marketing automation. 
                  Create workflows and capture leads to see performance metrics.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Email open and click rates</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>WhatsApp delivery and read receipts</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Conversion tracking and ROI metrics</span>
                  </div>
                </div>
                <Button onClick={() => (document.querySelector('[data-state="active"]') as HTMLElement | null)?.click()}>
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Track the performance of your marketing automation campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Email Performance</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sent</span>
                        <span className="font-medium">{stats.emailSent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivered</span>
                        <span className="font-medium">{Math.round(stats.emailSent * 0.95)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opened</span>
                        <span className="font-medium">{Math.round(stats.emailSent * 0.28)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">WhatsApp Performance</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sent</span>
                        <span className="font-medium">{stats.whatsappSent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivered</span>
                        <span className="font-medium">{Math.round(stats.whatsappSent * 0.98)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Read</span>
                        <span className="font-medium">{Math.round(stats.whatsappSent * 0.85)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}