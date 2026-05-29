import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useListNotifications, getListNotificationsQueryKey, useMarkAllNotificationsRead, useMarkNotificationRead } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching } = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey() }
  });

  const markAllReadMutation = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  });

  const markReadMutation = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    }
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  };

  const handleNotificationPress = (notification: any) => {
    if (!notification.isRead) {
      markReadMutation.mutate({ id: notification.id });
    }
    if (notification.requestId) {
      router.push(`/request/${notification.requestId}`);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[
        styles.notificationCard, 
        { backgroundColor: colors.card, borderColor: colors.border },
        !item.isRead && styles.unreadCard
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconBg, { backgroundColor: item.isRead ? colors.muted : colors.secondary }]}>
          <Feather 
            name={item.type === 'request_update' ? 'file-text' : 'bell'} 
            size={20} 
            color={item.isRead ? colors.mutedForeground : colors.primary} 
          />
        </View>
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.titleText, !item.isRead && { fontWeight: '700' }]}>{item.title}</Text>
        <Text style={[styles.messageText, { color: colors.mutedForeground }]}>{item.message}</Text>
        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, Platform.OS === 'web' && { paddingTop: 67 }]}>
      <View style={styles.header}>
        <Text style={styles.countText}>
          {data?.unreadCount || 0} unread notifications
        </Text>
        <TouchableOpacity 
          onPress={() => markAllReadMutation.mutate()}
          disabled={!data?.unreadCount || markAllReadMutation.isPending}
        >
          <Text style={[styles.markReadText, { color: colors.primary }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data?.data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, Platform.OS === 'web' && { paddingBottom: 34 }]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Feather name="bell-off" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  countText: {
    fontSize: 14,
    color: '#64748b',
  },
  markReadText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  unreadCard: {
    backgroundColor: '#f0f9ff',
  },
  iconContainer: {
    marginRight: 16,
    position: 'relative',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
});
