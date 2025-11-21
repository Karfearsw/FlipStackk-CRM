"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Save,
  Loader2,
  Check
} from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '@/hooks/use-api';
import { NotificationPreference } from '@/db/schema';

interface NotificationSettingsProps {
  className?: string;
}

interface NotificationType {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
}

const notificationTypes: NotificationType[] = [
  {
    key: 'message',
    label: 'Messages',
    description: 'New messages in channels and direct messages',
    icon: <MessageSquare className="h-4 w-4" />,
    defaultEnabled: true,
  },
  {
    key: 'mention',
    label: 'Mentions',
    description: 'When someone mentions you in a message',
    icon: <span className="text-sm font-bold">@</span>,
    defaultEnabled: true,
  },
  {
    key: 'task',
    label: 'Tasks',
    description: 'Task assignments and updates',
    icon: <span className="text-sm">✓</span>,
    defaultEnabled: true,
  },
  {
    key: 'lead',
    label: 'Leads',
    description: 'New leads and lead status changes',
    icon: <span className="text-sm">👤</span>,
    defaultEnabled: true,
  },
  {
    key: 'deal',
    label: 'Deals',
    description: 'Deal updates and pipeline changes',
    icon: <span className="text-sm">💰</span>,
    defaultEnabled: true,
  },
  {
    key: 'system',
    label: 'System',
    description: 'System updates and maintenance notifications',
    icon: <span className="text-sm">⚙️</span>,
    defaultEnabled: false,
  },
];

const channels = [
  { key: 'in_app', label: 'In-App', icon: <Bell className="h-4 w-4" /> },
  { key: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { key: 'push', label: 'Push', icon: <Smartphone className="h-4 w-4" /> },
  { key: 'sms', label: 'SMS', icon: <MessageSquare className="h-4 w-4" /> },
];

const frequencies = [
  { key: 'immediate', label: 'Immediately' },
  { key: 'daily', label: 'Daily digest' },
  { key: 'weekly', label: 'Weekly digest' },
  { key: 'never', label: 'Never' },
];

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [quietHours, setQuietHours] = useState({ start: '22:00', end: '08:00' });
  const [emailAddress, setEmailAddress] = useState('');

  const fetchPreferences = async () => {
    try {
      const response = await apiGet<{ preferences: NotificationPreference[] }>('/api/notifications/preferences');
      setPreferences(response.preferences);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (
    notificationType: string,
    channel: string,
    updates: Partial<NotificationPreference>
  ) => {
    try {
      const response: { preference: NotificationPreference } = await apiPost('/api/notifications/preferences', {
        notificationType,
        channel,
        ...updates,
      });
      
      // Update local state
      setPreferences(prev => {
        const existing = prev.find(
          p => p.notificationType === notificationType && p.channel === channel
        );
        
        if (existing) {
          return prev.map(p => 
            p.notificationType === notificationType && p.channel === channel
              ? { ...p, ...updates }
              : p
          );
        } else {
          return [...prev, response.preference];
        }
      });
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  };

  const deletePreference = async (notificationType: string, channel: string) => {
    try {
      await apiDelete(`/api/notifications/preferences?notificationType=${notificationType}&channel=${channel}`);
      setPreferences(prev => 
        prev.filter(p => !(p.notificationType === notificationType && p.channel === channel))
      );
    } catch (error) {
      console.error('Failed to delete preference:', error);
    }
  };

  const isPreferenceEnabled = (notificationType: string, channel: string): boolean => {
    const pref = preferences.find(
      p => p.notificationType === notificationType && p.channel === channel
    );
    return pref?.isEnabled ?? notificationTypes.find(t => t.key === notificationType)?.defaultEnabled ?? false;
  };

  const getFrequency = (notificationType: string, channel: string): string => {
    const pref = preferences.find(
      p => p.notificationType === notificationType && p.channel === channel
    );
    return pref?.frequency || 'immediate';
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save all preferences
      for (const type of notificationTypes) {
        for (const channel of channels) {
          const isEnabled = isPreferenceEnabled(type.key, channel.key);
          const frequency = getFrequency(type.key, channel.key);
          
          await updatePreference(type.key, channel.key, {
            isEnabled,
            frequency: frequency as 'immediate' | 'daily' | 'weekly' | 'never',
            quietHoursStart: quietHours.start,
            quietHoursEnd: quietHours.end,
            emailAddress: emailAddress || undefined,
          });
        }
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading notification settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Customize how you receive notifications across different channels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Notification Types</h3>
            
            {notificationTypes.map((type) => (
              <div key={type.key} className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="mt-1">{type.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {channels.map((channel) => (
                    <div key={channel.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {channel.icon}
                        <span className="text-sm font-medium">{channel.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isPreferenceEnabled(type.key, channel.key)}
                          onCheckedChange={(checked) => 
                            updatePreference(type.key, channel.key, { isEnabled: checked })
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {isPreferenceEnabled(type.key, channel.key) ? 'On' : 'Off'}
                        </span>
                      </div>
                      
                      <Select
                        value={getFrequency(type.key, channel.key)}
                        onValueChange={(value) => 
                          updatePreference(type.key, channel.key, { frequency: value as 'immediate' | 'daily' | 'weekly' | 'never' })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencies.map((freq) => (
                            <SelectItem key={freq.key} value={freq.key} className="text-xs">
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Quiet Hours</h3>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Set times when you don't want to receive notifications
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="quiet-start">From:</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={quietHours.start}
                    onChange={(e) => setQuietHours(prev => ({ ...prev, start: e.target.value }))}
                    className="w-24"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="quiet-end">To:</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={quietHours.end}
                    onChange={(e) => setQuietHours(prev => ({ ...prev, end: e.target.value }))}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Email Settings</h3>
            <div className="border rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email-address">Notification Email</Label>
                  <Input
                    id="email-address"
                    type="email"
                    placeholder="your-email@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="max-w-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use your account email address
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="min-w-32"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}