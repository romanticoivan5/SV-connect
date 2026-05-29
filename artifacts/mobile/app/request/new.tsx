import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateRequest, getListMyRequestsQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';

const REQUEST_TYPES = [
  { value: 'barangay_clearance', label: 'Barangay Clearance' },
  { value: 'certificate_of_residency', label: 'Certificate of Residency' },
  { value: 'business_permit', label: 'Business Permit' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'community_concern', label: 'Community Concern' },
];

export default function NewRequestScreen() {
  const [form, setForm] = useState({
    type: 'barangay_clearance',
    subject: '',
    description: '',
  });
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();

  const createMutation = useCreateRequest({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getListMyRequestsQueryKey() });
        Alert.alert('Success', 'Request submitted successfully');
        router.back();
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', err.error || 'Failed to submit request');
      },
    },
  });

  const handleSubmit = () => {
    if (!form.subject || !form.description) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }
    createMutation.mutate({ data: form as any });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.content, Platform.OS === 'web' && { paddingTop: 67, paddingBottom: 34 }]}>
        <View style={styles.section}>
          <Text style={styles.label}>Request Type</Text>
          <View style={styles.typeGrid}>
            {REQUEST_TYPES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  form.type === item.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setForm({ ...form, type: item.value })}
              >
                <Text style={[
                  styles.typeButtonText,
                  form.type === item.value ? { color: '#fff' } : { color: colors.foreground }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card }]}
            value={form.subject}
            onChangeText={(text) => setForm({ ...form, subject: text })}
            placeholder="e.g. Request for Travel Clearance"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.card }]}
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
            placeholder="Provide more details about your request..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
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
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#64748b',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#1a5276',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
