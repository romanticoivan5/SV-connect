import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRegister } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Feather } from '@expo/vector-icons';

type Stage = 'form' | 'pending';

export default function RegisterScreen() {
  const [stage, setStage] = useState<Stage>('form');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', address: '', contactNumber: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();
  const colors = useColors();

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Account is pending — do NOT log in, show pending screen instead
        setSubmittedName(`${form.firstName} ${form.lastName}`);
        setSubmittedEmail(form.email);
        setStage('pending');
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const msg = err?.data?.error || err?.message || 'Registration failed. Please try again.';
        setError(msg);
      },
    },
  });

  const handleRegister = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.address || !form.contactNumber) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    registerMutation.mutate({ data: form });
  };

  // ── Pending approval screen ──────────────────────────────────────────────
  if (stage === 'pending') {
    return (
      <View style={[styles.pendingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.pendingContent}>
          <View style={[styles.pendingIconRing, { borderColor: colors.primary + '40' }]}>
            <View style={[styles.pendingIconBg, { backgroundColor: colors.primary + '15' }]}>
              <Feather name="clock" size={40} color={colors.primary} />
            </View>
          </View>

          <Text style={[styles.pendingTitle, { color: colors.foreground }]}>
            Registration Submitted!
          </Text>
          <Text style={[styles.pendingSubtitle, { color: colors.mutedForeground }]}>
            Your account is pending approval by the barangay admin.
          </Text>

          <View style={[styles.pendingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.pendingRow}>
              <Feather name="user" size={15} color={colors.primary} />
              <Text style={[styles.pendingLabel, { color: colors.mutedForeground }]}>Name</Text>
              <Text style={[styles.pendingValue, { color: colors.foreground }]}>{submittedName}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.pendingRow}>
              <Feather name="mail" size={15} color={colors.primary} />
              <Text style={[styles.pendingLabel, { color: colors.mutedForeground }]}>Email</Text>
              <Text style={[styles.pendingValue, { color: colors.foreground }]} numberOfLines={1}>
                {submittedEmail}
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Feather name="info" size={14} color="#a16207" />
            <Text style={styles.infoText}>
              You will be able to log in once the barangay admin approves your registration.
              This usually takes 1–2 business days.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.goLoginBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.goLoginText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  const inputField = (
    label: string,
    key: keyof typeof form,
    opts?: { keyboardType?: any; secureTextEntry?: boolean; multiline?: boolean; autoCapitalize?: any }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={[styles.input, {
          borderColor: colors.border,
          backgroundColor: colors.card,
          color: colors.foreground,
          ...(opts?.multiline ? { height: 72, textAlignVertical: 'top', paddingTop: 12 } : {}),
        }]}
        value={form[key]}
        onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
        placeholderTextColor={colors.mutedForeground}
        {...opts}
      />
    </View>
  );

  return (
    <KeyboardAwareScrollViewCompat
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.content, Platform.OS === 'web' && { paddingTop: 67 }]}>
        {/* Back */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back to Login</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconBg, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="user-plus" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Register to access barangay services
          </Text>
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Fields */}
        <View style={styles.form}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              {inputField('First Name *', 'firstName')}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              {inputField('Last Name *', 'lastName')}
            </View>
          </View>

          {inputField('Email Address *', 'email', { keyboardType: 'email-address', autoCapitalize: 'none' })}
          {inputField('Password *', 'password', { secureTextEntry: true })}
          {inputField('Home Address *', 'address', { multiline: true })}
          {inputField('Contact Number *', 'contactNumber', { keyboardType: 'phone-pad' })}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, registerMutation.isPending && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Create Account</Text>}
          </TouchableOpacity>

          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            * Your account will require admin approval before you can log in.
          </Text>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  content: { padding: 24 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  backText: { fontSize: 14, fontWeight: '500' },
  header: { alignItems: 'center', marginBottom: 24 },
  iconBg: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, color: '#dc2626', fontSize: 13 },
  form: {},
  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { height: 48, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, fontSize: 15 },
  submitBtn: {
    height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 17 },
  // Pending screen
  pendingContainer: { flex: 1 },
  pendingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  pendingIconRing: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  pendingIconBg: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  pendingTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  pendingSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  pendingCard: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingLabel: { fontSize: 13, minWidth: 46 },
  pendingValue: { fontSize: 14, fontWeight: '600', flex: 1 },
  divider: { height: 1, marginVertical: 12 },
  infoBox: {
    flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 12,
    padding: 14, marginBottom: 28, alignItems: 'flex-start',
    backgroundColor: '#fefce8', borderColor: '#fde047',
  },
  infoText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 19 },
  goLoginBtn: { width: '100%', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goLoginText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
