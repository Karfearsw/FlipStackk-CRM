import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Check, 
  X, 
  Trash2, 
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageCircle,
  AtSign,
  Calendar,
  User,
  DollarSign,
  Settings as SettingsIcon
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/hooks/use-api';
import { Notification } from '@/db/schema';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface NotificationCenterProps {
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export function NotificationCenter({ className = '', onNotificationClick }: NotificationCenterProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, byType: {} });
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('unreadOnly', 'true');
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const response = await apiGet<{ notifications?: Notification[] }>(`/api/notifications?${params}`);
      const list = Array.isArray(response.notifications) ? response.notifications : [];
      setNotifications(list);
      
      // Calculate stats
      const unread = list.filter(n => !n.isRead).length;
      const byType = list.reduce((acc, n) => {
        const typeKey = n.type || 'unknown';
        acc[typeKey] = (acc[typeKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      setStats({
        total: list.length,
        unread,
        byType
      });
    } catch (error: any) {
      const message = typeof error === 'string' 
        ? error 
        : (error?.message ?? 'Unable to fetch notifications');
      const status = (error as any)?.status ?? (error instanceof Response ? error.status : undefined);
      console.error('Failed to fetch notifications:', { message, status, error });
      toast({
        title: 'Notifications Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await apiPatch(`/api/notifications/${notificationId}`, {});
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)
      );
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiPatch('/api/notifications', {});
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setStats(prev => ({ ...prev, unread: 0 }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await apiDelete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        unread: prev.unread - (notifications.find(n => n.id === notificationId && !n.isRead) ? 1 : 0)
      }));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    
    onNotificationClick?.(notification);
  };

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (type) {
      case 'info': return <Info {...iconProps} />;
      case 'success': return <CheckCircle {...iconProps} />;
      case 'warning': return <AlertCircle {...iconProps} />;
      case 'error': return <XCircle {...iconProps} />;
      case 'message': return <MessageCircle {...iconProps} />;
      case 'mention': return <AtSign {...iconProps} />;
      case 'task': return <Calendar {...iconProps} />;
      case 'lead': return <User {...iconProps} />;
      case 'deal': return <DollarSign {...iconProps} />;
      case 'system': return <SettingsIcon {...iconProps} />;
      default: return <Bell {...iconProps} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'message': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'mention': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [session?.user?.id, filter, typeFilter]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.isRead) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        {stats.unread > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {stats.unread > 99 ? '99+' : stats.unread}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border z-50">
          <Card className="border-0 shadow-none">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Notifications</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={stats.unread === 0}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('/settings/notifications', '_blank')}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All ({stats.total})</option>
                  <option value="unread">Unread ({stats.unread})</option>
                </select>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Types</option>
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-h-96">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="divide-y">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon and Priority */}
                          <div className="flex flex-col items-center gap-1">
                            <div className={`p-2 rounded-full ${getNotificationColor(notification.type || 'info')}`}>
                              {getNotificationIcon(notification.type || 'info')}
                            </div>
                            {!notification.isRead && (
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority || 'medium')}`} />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {notification.title}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </div>
                                {notification.actionUrl && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    Click to view details →
                                  </div>
                                )}
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}