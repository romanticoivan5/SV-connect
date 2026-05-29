import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGetAnnouncement, getGetAnnouncementQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();

  const { data: announcement, isLoading } = useGetAnnouncement(Number(id), {
    query: { queryKey: getGetAnnouncementQueryKey(Number(id)) }
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!announcement) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={colors.destructive} />
        <Text style={styles.errorText}>Announcement not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.content, Platform.OS === 'web' && { paddingTop: 67, paddingBottom: 34 }]}>
        <View style={styles.header}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryText, { color: colors.secondaryForeground }]}>
              {announcement.category || 'General'}
            </Text>
          </View>
          <Text style={styles.titleText}>{announcement.title}</Text>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={14} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {new Date(announcement.createdAt).toLocaleDateString()}
            </Text>
            <View style={styles.metaDivider} />
            <Feather name="user" size={14} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              Admin
            </Text>
          </View>
        </View>

        <View style={[styles.body, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.contentText}>{announcement.content}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    color: '#64748b',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    marginLeft: 6,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  body: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 300,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#334155',
  },
});
