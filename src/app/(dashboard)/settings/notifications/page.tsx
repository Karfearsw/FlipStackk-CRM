import { NotificationSettings } from '@/components/communication/notification-settings';

export default function NotificationsSettingsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">
          Customize how and when you receive notifications
        </p>
      </div>
      
      <NotificationSettings />
    </div>
  );
}