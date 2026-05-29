import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGetRequest, getGetRequestQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  barangay_clearance: "Barangay Clearance",
  certificate_of_residency: "Certificate of Residency",
  business_permit: "Business Permit",
  complaint: "Complaint",
  community_concern: "Community Concern",
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();

  const { data: request, isLoading } = useGetRequest(Number(id), {
    query: { queryKey: getGetRequestQueryKey(Number(id)) }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.statusPending;
      case 'approved': return colors.statusApproved;
      case 'rejected': return colors.statusRejected;
      default: return colors.mutedForeground;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={colors.destructive} />
        <Text style={styles.errorText}>Request not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.content, Platform.OS === 'web' && { paddingTop: 67, paddingBottom: 34 }]}>
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {request.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.typeText}>{REQUEST_TYPE_LABELS[request.type] || request.type}</Text>
          <Text style={styles.subjectText}>{request.subject}</Text>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
            Submitted on {new Date(request.createdAt).toLocaleString()}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{request.description}</Text>
        </View>

        {request.remarks && (
          <View style={[styles.section, styles.remarksSection, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}>
            <Text style={[styles.sectionLabel, { color: '#9a3412' }]}>Admin Remarks</Text>
            <Text style={styles.remarksText}>{request.remarks}</Text>
          </View>
        )}

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Request ID</Text>
            <Text style={styles.infoValue}>#{request.id}</Text>
          </View>
          {request.processedAt && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Processed At</Text>
              <Text style={styles.infoValue}>{new Date(request.processedAt).toLocaleString()}</Text>
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
    marginBottom: 32,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0f172a',
  },
  remarksSection: {
    borderWidth: 1,
  },
  remarksText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#9a3412',
    fontStyle: 'italic',
  },
  infoGrid: {
    marginTop: 12,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
});
