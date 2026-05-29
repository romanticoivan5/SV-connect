import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useUpdateProfile, useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const colors = useColors();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: user?.address || '',
    contactNumber: user?.contactNumber || '',
    password: '',
  });

  const updateMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setForm(prev => ({ ...prev, password: '' }));
        Alert.alert('Success', 'Profile updated successfully');
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', err.error || 'Failed to update profile');
      },
    },
  });

  const handleUpdate = () => {
    const data: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      address: form.address,
      contactNumber: form.contactNumber,
    };
    if (form.password) {
      data.password = form.password;
    }
    updateMutation.mutate({ data });
  };

  const doLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleLogout = () => {
    // Alert.alert has no working buttons on React Native Web — use window.confirm there
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to logout?') : true;
      if (confirmed) doLogout();
      return;
    }
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.content, Platform.OS === 'web' && { paddingTop: 67, paddingBottom: 34 }]}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card }]}
              value={form.firstName}
              onChangeText={text => setForm({ ...form, firstName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card }]}
              value={form.lastName}
              onChangeText={text => setForm({ ...form, lastName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card }]}
              value={form.address}
              onChangeText={text => setForm({ ...form, address: text })}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card }]}
              value={form.contactNumber}
              onChangeText={text => setForm({ ...form, contactNumber: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password (leave blank to keep current)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card }]}
              value={form.password}
              onChangeText={text => setForm({ ...form, password: text })}
              secureTextEntry
              placeholder="Min 6 characters"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleUpdate}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.destructive }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Logout</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#64748b',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
