import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useListAnnouncements, getListAnnouncementsQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

export default function AnnouncementsScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching } = useListAnnouncements({
    params: { page: 1, limit: 50 },
    query: { queryKey: getListAnnouncementsQueryKey({ page: 1, limit: 50 }) }
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.announcementCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/announcement/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.categoryText, { color: colors.secondaryForeground }]}>
            {item.category || 'General'}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={[styles.previewText, { color: colors.mutedForeground }]} numberOfLines={3}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, Platform.OS === 'web' && { paddingTop: 67 }]}>
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
              <Feather name="megaphone" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No announcements found</Text>
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
  listContent: {
    padding: 16,
  },
  announcementCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 22,
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
