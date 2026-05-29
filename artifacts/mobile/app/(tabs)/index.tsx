import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useListMyRequests, getListMyRequestsQueryKey, useListAnnouncements, getListAnnouncementsQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

export default function HomeScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: requests, isLoading: isLoadingRequests, isRefetching: isRefetchingRequests } = useListMyRequests({
    query: { queryKey: getListMyRequestsQueryKey() }
  });

  const { data: announcements, isLoading: isLoadingAnnouncements, isRefetching: isRefetchingAnnouncements } = useListAnnouncements({
    params: { page: 1, limit: 3 },
    query: { queryKey: getListAnnouncementsQueryKey({ page: 1, limit: 3 }) }
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListMyRequestsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey({ page: 1, limit: 3 }) });
  };

  const stats = {
    pending: requests?.data.filter(r => r.status === 'pending').length || 0,
    approved: requests?.data.filter(r => r.status === 'approved').length || 0,
    rejected: requests?.data.filter(r => r.status === 'rejected').length || 0,
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetchingRequests || isRefetchingAnnouncements} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.content, Platform.OS === 'web' && { paddingTop: 67, paddingBottom: 34 }]}>
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>Welcome back,</Text>
          <Text style={[styles.nameText, { color: colors.primary }]}>{user?.firstName} {user?.lastName}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.newRequestButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/request/new')}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.newRequestText}>Submit New Request</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Requests Overview</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.statusPending }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.statusApproved }]}>{stats.approved}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.statusRejected }]}>{stats.rejected}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Announcements</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {announcements?.data.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.announcementItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/announcement/${item.id}`)}
            >
              <View style={styles.announcementMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.categoryText, { color: colors.secondaryForeground }]}>{item.category || 'General'}</Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.announcementTitle}>{item.title}</Text>
              <Text style={[styles.announcementPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
                {item.content}
              </Text>
            </TouchableOpacity>
          ))}
          
          {announcements?.data.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="megaphone" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No announcements yet</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
  },
  newRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  newRequestText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  announcementItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  announcementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  announcementPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
