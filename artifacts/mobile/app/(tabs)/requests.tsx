import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useListMyRequests, getListMyRequestsQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  barangay_clearance: "Barangay Clearance",
  certificate_of_residency: "Certificate of Residency",
  business_permit: "Business Permit",
  complaint: "Complaint",
  community_concern: "Community Concern",
};

export default function RequestsScreen() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching } = useListMyRequests({
    params: { status: statusFilter as any },
    query: { queryKey: getListMyRequestsQueryKey({ status: statusFilter as any }) }
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListMyRequestsQueryKey() });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.statusPending;
      case 'approved': return colors.statusApproved;
      case 'rejected': return colors.statusRejected;
      default: return colors.mutedForeground;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/request/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.typeText}>{REQUEST_TYPE_LABELS[item.type] || item.type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.subjectText} numberOfLines={1}>{item.subject}</Text>
      <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
        Submitted on {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, Platform.OS === 'web' && { paddingTop: 67 }]}>
      <View style={styles.filterContainer}>
        {['All', 'Pending', 'Approved', 'Rejected'].map((filter) => {
          const value = filter === 'All' ? undefined : filter.toLowerCase();
          const isActive = statusFilter === value;
          return (
            <TouchableOpacity 
              key={filter}
              style={[
                styles.filterTab, 
                isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
              ]}
              onPress={() => setStatusFilter(value)}
            >
              <Text style={[
                styles.filterTabText, 
                isActive ? { color: colors.primary, fontWeight: '600' } : { color: colors.mutedForeground }
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
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
              <Feather name="file-text" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No requests found</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/request/new')}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  requestCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '600',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
