import React from 'react';
import {
  StyleSheet, View, Text, ScrollView,
  TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
  useListMyRequests, getListMyRequestsQueryKey,
  useListAnnouncements, getListAnnouncementsQueryKey,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

const REQUEST_TYPES: Record<string, string> = {
  barangay_clearance: 'Clearance',
  certificate_of_residency: 'Residency',
  business_permit: 'Business',
  complaint: 'Complaint',
  community_concern: 'Concern',
};

export default function HomeScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: requests, isRefetching: refetchingReq } = useListMyRequests({
    query: { queryKey: getListMyRequestsQueryKey() },
  });
  const { data: announcements, isRefetching: refetchingAnn } = useListAnnouncements({
    params: { page: 1, limit: 3 },
    query: { queryKey: getListAnnouncementsQueryKey({ page: 1, limit: 3 }) },
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListMyRequestsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey({ page: 1, limit: 3 }) });
  };

  const pending = requests?.data.filter(r => r.status === 'pending').length ?? 0;
  const approved = requests?.data.filter(r => r.status === 'approved').length ?? 0;
  const rejected = requests?.data.filter(r => r.status === 'rejected').length ?? 0;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refetchingReq || refetchingAnn} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero header */}
      <LinearGradient
        colors={['#1d4ed8', '#2563eb', '#3b82f6']}
        style={[styles.hero, Platform.OS === 'web' && { paddingTop: 90 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroBg}>
          <View style={styles.heroBubble1} />
          <View style={styles.heroBubble2} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroGreeting}>Good day,</Text>
          <Text style={styles.heroName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.heroRole}>Barangay Resident</Text>
        </View>
        <TouchableOpacity
          style={styles.heroButton}
          onPress={() => router.push('/request/new')}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#1d4ed8" />
          <Text style={styles.heroButtonText}>New Request</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Pending', value: pending, color: '#f59e0b', bg: '#fffbeb', icon: 'clock' },
          { label: 'Approved', value: approved, color: '#10b981', bg: '#ecfdf5', icon: 'check-circle' },
          { label: 'Rejected', value: rejected, color: '#ef4444', bg: '#fef2f2', icon: 'x-circle' },
        ].map((s) => (
          <TouchableOpacity
            key={s.label}
            style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.color + '30' }]}
            onPress={() => router.push('/(tabs)/requests')}
            activeOpacity={0.8}
          >
            <Feather name={s.icon as any} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: s.color + 'cc' }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {[
            { icon: 'file-text', label: 'Clearance', type: 'barangay_clearance', color: '#3b82f6' },
            { icon: 'home', label: 'Residency', type: 'certificate_of_residency', color: '#8b5cf6' },
            { icon: 'briefcase', label: 'Business', type: 'business_permit', color: '#f59e0b' },
            { icon: 'alert-triangle', label: 'Complaint', type: 'complaint', color: '#ef4444' },
          ].map((a) => (
            <TouchableOpacity
              key={a.type}
              style={[styles.quickCard, { backgroundColor: a.color + '12', borderColor: a.color + '25' }]}
              onPress={() => router.push('/request/new')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIcon, { backgroundColor: a.color + '20' }]}>
                <Feather name={a.icon as any} size={20} color={a.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Announcements */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Announcements</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>View all</Text>
          </TouchableOpacity>
        </View>

        {!announcements?.data.length ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="megaphone" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No announcements yet</Text>
          </View>
        ) : (
          announcements.data.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.annCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/announcement/${item.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.annTop}>
                <View style={[styles.annBadge, { backgroundColor: '#dbeafe' }]}>
                  <Text style={styles.annBadgeText}>{item.category ?? 'General'}</Text>
                </View>
                <Text style={[styles.annDate, { color: colors.mutedForeground }]}>
                  {new Date(item.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <Text style={[styles.annTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.annPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
                {item.content}
              </Text>
              <View style={styles.annFooter}>
                <Text style={[styles.annReadMore, { color: colors.primary }]}>Read more</Text>
                <Feather name="chevron-right" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingBottom: 32 },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  heroBg: { ...StyleSheet.absoluteFillObject },
  heroBubble1: {
    position: 'absolute', top: -40, right: -30,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroBubble2: {
    position: 'absolute', bottom: -20, left: 40,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroText: { marginBottom: 24 },
  heroGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  heroName: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 2 },
  heroRole: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  heroButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start',
  },
  heroButtonText: { fontSize: 15, fontWeight: '700', color: '#1d4ed8' },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: -20, marginBottom: 8 },
  statCard: {
    flex: 1, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', paddingVertical: 16, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  viewAll: { fontSize: 13, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '47%', borderRadius: 16, borderWidth: 1.5,
    padding: 16, alignItems: 'center', gap: 10,
  },
  quickIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '600' },
  emptyState: {
    borderRadius: 16, borderWidth: 1, padding: 40,
    alignItems: 'center', gap: 12,
  },
  emptyText: { fontSize: 14 },
  annCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  annTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  annBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  annBadgeText: { fontSize: 11, fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase' },
  annDate: { fontSize: 11 },
  annTitle: { fontSize: 15, fontWeight: '700', marginBottom: 5 },
  annPreview: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  annFooter: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  annReadMore: { fontSize: 12, fontWeight: '600' },
});
