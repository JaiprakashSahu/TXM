'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib';
import { formatDateTime } from '@/lib/utils';
import { Notification, NotificationStatus } from '@/types';
import { Card, CardHeader, Badge, Spinner } from '@/components/ui';
import { Bell, CheckCircle, Clock, XCircle } from 'lucide-react';

const statusVariant: Record<NotificationStatus, 'primary' | 'success' | 'danger'> = {
  pending: 'primary',
  sent: 'success',
  failed: 'danger',
};

const statusIcon: Record<NotificationStatus, React.ElementType> = {
  pending: Clock,
  sent: CheckCircle,
  failed: XCircle,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get('/notifications/my');
        setNotifications(response.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Notifications</h1>
        <p className="text-surface-400 mt-1">Your recent notifications</p>
      </div>

      {error && (
        <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-surface-500 mx-auto mb-3" />
            <p className="text-surface-400">No notifications yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const StatusIcon = statusIcon[notification.status];
            return (
              <Card key={notification._id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-surface-700 rounded-lg">
                    <StatusIcon
                      className={`h-4 w-4 ${
                        notification.status === 'sent'
                          ? 'text-success-500'
                          : notification.status === 'failed'
                          ? 'text-danger-500'
                          : 'text-primary-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-surface-100 truncate">{notification.title}</h3>
                      <Badge variant={statusVariant[notification.status]} className="flex-shrink-0">
                        {notification.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-surface-400 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-surface-500 mt-2">
                      {formatDateTime(notification.createdAt)} • {notification.channel}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
