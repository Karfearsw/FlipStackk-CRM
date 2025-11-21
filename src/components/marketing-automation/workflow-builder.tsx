'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  ArrowRight, 
  Clock, 
  Mail, 
  MessageSquare,
  Copy,
  Target,
  Webhook,
  UserPlus,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger: {
    type: string;
    source?: string;
  };
  actions: WorkflowAction[];
  metrics: {
    executions: number;
    conversions: number;
    conversionRate: number;
  };
}

interface WorkflowAction {
  id: string;
  type: string;
  delay?: number;
  config: any;
}

interface WorkflowBuilderProps {
  workflows: Workflow[];
}

export function WorkflowBuilder({ workflows }: WorkflowBuilderProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const actionIcons = {
    send_email: Mail,
    send_sms: MessageSquare,
    send_whatsapp: MessageSquare,
    add_tag: Target,
    create_task: Target,
    wait: Clock,
    webhook: Webhook,
    add_to_segment: UserPlus
  };

  const getActionIcon = (type: string) => {
    const Icon = actionIcons[type as keyof typeof actionIcons] || Target;
    return Icon;
  };

  const formatDelay = (delay?: number) => {
    if (!delay) return 'Immediately';
    if (delay < 60000) return `${delay / 1000}s`;
    if (delay < 3600000) return `${Math.floor(delay / 60000)}m`;
    if (delay < 86400000) return `${Math.floor(delay / 3600000)}h`;
    return `${Math.floor(delay / 86400000)}d`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      case 'archived': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (selectedWorkflow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedWorkflow(null)}
            >
              ← Back to Workflows
            </Button>
            <div>
              <h3 className="text-lg font-medium">{selectedWorkflow.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedWorkflow.status === 'active' ? 'destructive' : 'default'}
              size="sm"
            >
              {selectedWorkflow.status === 'active' ? (
                <><Pause className="mr-2 h-4 w-4" /> Pause</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Activate</>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Trigger</CardTitle>
                <CardDescription>What starts this workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium capitalize">{selectedWorkflow.trigger.type.replace('_', ' ')}</p>
                    {selectedWorkflow.trigger.source && (
                      <p className="text-sm text-muted-foreground">Source: {selectedWorkflow.trigger.source}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Workflow Actions</CardTitle>
                    <CardDescription>What happens after the trigger</CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Action
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedWorkflow.actions.map((action, index) => {
                    const Icon = getActionIcon(action.type);
                    return (
                      <div key={action.id} className="relative">
                        <div className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                              <Icon className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium capitalize">{action.type.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDelay(action.delay)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {index < selectedWorkflow.actions.length - 1 && (
                          <div className="absolute left-6 top-full -mt-2">
                            <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Executions</span>
                    <span className="font-medium">{selectedWorkflow.metrics.executions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversions</span>
                    <span className="font-medium">{selectedWorkflow.metrics.conversions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="font-medium">{selectedWorkflow.metrics.conversionRate}%</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">{selectedWorkflow.metrics.conversionRate}%</span>
                  </div>
                  <Progress value={selectedWorkflow.metrics.conversionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Workflow
                </Button>
                <Button className="w-full" variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Settings
                </Button>
                <Button className="w-full" variant="outline" size="sm">
                  <Target className="mr-2 h-4 w-4" />
                  Test Workflow
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Marketing Workflows</h3>
          <p className="text-sm text-muted-foreground">
            Automate your marketing campaigns with intelligent workflows
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn("w-3 h-3 rounded-full", getStatusColor(workflow.status))} />
                  <div>
                    <CardTitle className="text-base">{workflow.name}</CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                    {workflow.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Executions</p>
                  <p className="text-2xl font-bold">{workflow.metrics.executions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">{workflow.metrics.conversions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{workflow.metrics.conversionRate}%</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trigger:</span>
                  <Badge variant="outline">{workflow.trigger.type.replace('_', ' ')}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}