import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, CheckCheck, Trash2, Mail, MailOpen,
  Trophy, X, AlertCircle, Info, CheckCircle, XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface NotificationData {
  entryId?: string;
  metricName?: string;
  value?: number;
  unit?: string;
  reviewNotes?: string;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: NotificationData | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    unread: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  METRIC_APPROVED: <CheckCircle className="w-5 h-5 text-green-500" />,
  METRIC_REJECTED: <XCircle className="w-5 h-5 text-red-500" />,
  ELO_CHANGE: <Trophy className="w-5 h-5 text-blue-500" />,
  TIER_CHANGE: <Trophy className="w-5 h-5 text-purple-500" />,
  SYSTEM: <Info className="w-5 h-5 text-gray-500" />,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  METRIC_APPROVED: 'border-green-200 bg-green-50',
  METRIC_REJECTED: 'border-red-200 bg-red-50',
  ELO_CHANGE: 'border-blue-200 bg-blue-50',
  TIER_CHANGE: 'border-purple-200 bg-purple-50',
  SYSTEM: 'border-gray-200 bg-gray-50',
};

export default function Notifications() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    unread: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Load notifications
  const loadNotifications = async (reset = false) => {
    try {
      const offset = reset ? 0 : pagination.offset;
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString(),
        unreadOnly: filter === 'unread' ? 'true' : 'false',
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to load notifications');

      const data: NotificationsResponse = await response.json();
      
      if (reset) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      
      setPagination({
        ...data.pagination,
        offset: reset ? data.pagination.limit : offset + data.pagination.limit,
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      addToast({
        type: 'error',
        title: 'Loading Failed',
        message: 'Could not load notifications. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadNotifications(true);
    }
  }, [session, filter]);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markAsRead',
          notificationIds,
        }),
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, readAt: new Date().toISOString() }
            : notification
        )
      );

      setPagination(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - notificationIds.length),
      }));

      setSelectedNotifications(new Set());
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not mark notifications as read.',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, readAt: new Date().toISOString() }))
      );

      setPagination(prev => ({ ...prev, unread: 0 }));
      
      addToast({
        type: 'success',
        title: 'All Read',
        message: 'All notifications marked as read.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not mark all notifications as read.',
      });
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) throw new Error('Failed to delete notifications');

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => !notificationIds.includes(notification.id))
      );

      setSelectedNotifications(new Set());
      
      addToast({
        type: 'success',
        title: 'Deleted',
        message: `Deleted ${notificationIds.length} notification(s).`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete notifications.',
      });
    }
  };

  const toggleNotificationSelection = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const selectAll = () => {
    setSelectedNotifications(new Set(notifications.map(n => n.id)));
  };

  const selectNone = () => {
    setSelectedNotifications(new Set());
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffDays < 7) return `${Math.floor(diffDays)}d ago`;
    return date.toLocaleDateString();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">
                  {pagination.total} total • {pagination.unread} unread
                </p>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread ({pagination.unread})
              </button>
            </div>
          </div>

          {/* Action Bar */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <button
                  onClick={selectNone}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Select None
                </button>
                <span className="text-sm text-gray-500">
                  {selectedNotifications.size} selected
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {selectedNotifications.size > 0 && (
                  <>
                    <button
                      onClick={() => markAsRead(Array.from(selectedNotifications))}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Read</span>
                    </button>
                    <button
                      onClick={() => deleteNotifications(Array.from(selectedNotifications))}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
                
                {pagination.unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Mark All Read</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`
                  bg-white rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer
                  ${notification.readAt ? 'border-gray-200' : 'border-blue-200 bg-blue-50'}
                  ${selectedNotifications.has(notification.id) ? 'ring-2 ring-blue-500' : ''}
                  ${NOTIFICATION_COLORS[notification.type] || 'border-gray-200 bg-white'}
                  hover:shadow-md
                `}
                onClick={() => toggleNotificationSelection(notification.id)}
              >
                <div className="flex items-start space-x-4">
                  {/* Selection Checkbox */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center
                      ${selectedNotifications.has(notification.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}>
                      {selectedNotifications.has(notification.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Notification Icon */}
                  <div className="flex-shrink-0">
                    {NOTIFICATION_ICONS[notification.type] || <Info className="w-5 h-5 text-gray-500" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {notification.body}
                        </p>
                        
                        {/* Additional Data for Rejections */}
                        {notification.type === 'METRIC_REJECTED' && notification.data?.reviewNotes && (
                          <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                            <p className="text-sm font-medium text-red-800 mb-1">
                              Reason for rejection:
                            </p>
                            <p className="text-sm text-red-700">
                              {notification.data.reviewNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Read Status */}
                      <div className="flex items-center space-x-2 ml-4">
                        {notification.readAt ? (
                          <MailOpen className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Mail className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {notifications.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? 'All caught up! Check back later for new updates.'
                  : 'When you submit entries or have updates, they\'ll appear here.'
                }
              </p>
            </div>
          )}

          {/* Load More */}
          {pagination.hasMore && (
            <div className="text-center py-6">
              <button
                onClick={() => loadNotifications(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
