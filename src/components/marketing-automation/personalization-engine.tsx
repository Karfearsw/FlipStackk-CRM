'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Users, 
  MessageSquare, 
  Eye, 
  Plus,
  Edit,
  Trash2,
  Play,
  Copy,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonalizationRule {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  segments: string[];
  conditions: PersonalizationCondition[];
  content: PersonalizationContent;
  priority: number;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    engagementRate: number;
  };
}

interface PersonalizationCondition {
  type: 'segment' | 'behavior' | 'field_value' | 'time' | 'device' | 'location';
  field?: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

interface PersonalizationContent {
  type: 'text' | 'image' | 'video' | 'html' | 'component';
  content: string;
  variants?: PersonalizationVariant[];
  fallback?: string;
}

interface PersonalizationVariant {
  id: string;
  name: string;
  weight: number;
  content: string;
  conditions?: PersonalizationCondition[];
}

export function PersonalizationEngine() {
  const [rules] = useState<PersonalizationRule[]>([
    {
      id: 'rule_1',
      name: 'High-Value Property Sellers',
      description: 'Personalized content for sellers with properties over $500K',
      status: 'active',
      segments: ['high_value_sellers', 'premium_leads'],
      conditions: [
        { type: 'field_value', field: 'property_value', operator: 'greater_than', value: 500000 },
        { type: 'segment', operator: 'equals', value: 'high_value_sellers' }
      ],
      content: {
        type: 'text',
        content: 'Get a premium evaluation for your high-value property with our expert team.',
        fallback: 'Get a free property evaluation today.'
      },
      priority: 1,
      metrics: { impressions: 1250, clicks: 187, conversions: 23, engagementRate: 14.96 }
    },
    {
      id: 'rule_2',
      name: 'First-Time Sellers',
      description: 'Educational content for first-time property sellers',
      status: 'active',
      segments: ['first_time_sellers', 'new_leads'],
      conditions: [
        { type: 'field_value', field: 'seller_type', operator: 'equals', value: 'first_time' },
        { type: 'behavior', operator: 'equals', value: 'visited_selling_guide' }
      ],
      content: {
        type: 'component',
        content: 'selling_guide_cta',
        fallback: 'Learn about the selling process with our comprehensive guide.'
      },
      priority: 2,
      metrics: { impressions: 3420, clicks: 411, conversions: 45, engagementRate: 12.02 }
    },
    {
      id: 'rule_3',
      name: 'Mobile Users',
      description: 'Mobile-optimized content for smartphone users',
      status: 'paused',
      segments: ['mobile_users'],
      conditions: [
        { type: 'device', operator: 'equals', value: 'mobile' }
      ],
      content: {
        type: 'text',
        content: 'Get a quick property evaluation on your mobile device - takes just 2 minutes!',
        variants: [
          { id: 'variant_1', name: 'Short Version', weight: 50, content: 'Quick mobile evaluation in 2 minutes!' },
          { id: 'variant_2', name: 'Benefit Focus', weight: 50, content: 'Mobile evaluation - know your property value instantly!' }
        ]
      },
      priority: 3,
      metrics: { impressions: 890, clicks: 98, conversions: 8, engagementRate: 11.01 }
    }
  ]);

  const [selectedRule, setSelectedRule] = useState<PersonalizationRule | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getConditionTypeIcon = (type: string) => {
    switch (type) {
      case 'segment': return Users;
      case 'behavior': return Eye;
      case 'field_value': return Target;
      default: return Target;
    }
  };

  if (selectedRule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedRule(null)}
            >
              ← Back to Rules
            </Button>
            <div>
              <h3 className="text-lg font-medium">{selectedRule.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedRule.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedRule.status === 'active' ? 'destructive' : 'default'}
              size="sm"
            >
              {selectedRule.status === 'active' ? (
                <><Settings className="mr-2 h-4 w-4" /> Pause</>
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
                <CardTitle>Targeting Conditions</CardTitle>
                <CardDescription>When this personalization rule applies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedRule.conditions.map((condition, index) => {
                    const Icon = getConditionTypeIcon(condition.type);
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{condition.type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {condition.field && `${condition.field} `}
                            {condition.operator} {condition.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personalized Content</CardTitle>
                <CardDescription>What users see when this rule matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{selectedRule.content.type}</Badge>
                      <Badge variant="secondary">Priority: {selectedRule.priority}</Badge>
                    </div>
                    <p className="text-sm">{selectedRule.content.content}</p>
                  </div>
                  
                  {selectedRule.content.variants && selectedRule.content.variants.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">A/B Test Variants</h4>
                      {selectedRule.content.variants.map((variant) => (
                        <div key={variant.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{variant.name}</span>
                            <Badge variant="outline">{variant.weight}%</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{variant.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedRule.content.fallback && (
                    <div className="p-3 border border-dashed rounded-lg">
                      <p className="text-sm font-medium mb-1">Fallback Content</p>
                      <p className="text-sm text-muted-foreground">{selectedRule.content.fallback}</p>
                    </div>
                  )}
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
                    <span className="text-muted-foreground">Impressions</span>
                    <span className="font-medium">{selectedRule.metrics.impressions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Clicks</span>
                    <span className="font-medium">{selectedRule.metrics.clicks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversions</span>
                    <span className="font-medium">{selectedRule.metrics.conversions}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Engagement Rate</span>
                    <span className="font-medium">{selectedRule.metrics.engagementRate}%</span>
                  </div>
                  <Progress value={selectedRule.metrics.engagementRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedRule.segments.map((segment) => (
                    <Badge key={segment} variant="outline" className="mr-2">
                      {segment}
                    </Badge>
                  ))}
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
                  Duplicate Rule
                </Button>
                <Button className="w-full" variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Settings
                </Button>
                <Button className="w-full" variant="outline" size="sm">
                  <Target className="mr-2 h-4 w-4" />
                  Preview Rule
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
          <h3 className="text-lg font-medium">Personalization Rules</h3>
          <p className="text-sm text-muted-foreground">
            Create targeted content experiences based on user segments and behavior
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn("w-3 h-3 rounded-full", getStatusColor(rule.status))} />
                  <div>
                    <CardTitle className="text-base">{rule.name}</CardTitle>
                    <CardDescription>{rule.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                    {rule.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedRule(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Impressions</p>
                  <p className="text-2xl font-bold">{rule.metrics.impressions.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                  <p className="text-2xl font-bold">{rule.metrics.engagementRate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">{rule.metrics.conversions}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {rule.segments.map((segment) => (
                      <Badge key={segment} variant="outline">
                        {segment}
                      </Badge>
                    ))}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    Priority: {rule.priority}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}