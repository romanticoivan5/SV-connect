import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, StatusBar, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const colors = useColors();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await login(data.token, data.user);
        router.replace('/(tabs)');
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errData = err?.data ?? {};
        if (errData.error === 'pending') {
          setIsPending(true);
          setError('');
        } else {
          setIsPending(false);
          setError(errData.message || errData.error || 'Invalid email or password.');
        }
      },
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setIsPending(false);
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <KeyboardAwareScrollViewCompat contentContainerStyle={styles.scroll}>
      <StatusBar barStyle="light-content" />

      {/* Hero gradient */}
      <LinearGradient
        colors={['#1d4ed8', '#2563eb', '#3b82f6']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.logoRing}>
            <Feather name="shield" size={32} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>SV Connect</Text>
          <Text style={styles.heroSubtitle}>Your community, connected.</Text>
        </View>
      </LinearGradient>

      {/* Card */}
      <View style={[styles.card, Platform.OS === 'web' && { paddingBottom: 40 }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>Sign in to your resident account</Text>

        {/* Pending banner */}
        {isPending && (
          <View style={styles.pendingBanner}>
            <Feather name="clock" size={18} color="#a16207" />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Account Pending Approval</Text>
              <Text style={styles.pendingDesc}>
                Your account is being reviewed by the barangay admin. You'll be able to log in once approved.
              </Text>
            </View>
          </View>
        )}

        {/* Error banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={15} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="mail" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputText, { color: colors.foreground }]}
              placeholder="Enter your email"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputText, { color: colors.foreground, flex: 1 }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.eyeBtn}>
              <Feather name={showPw ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.loginBtn, loginMutation.isPending && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loginMutation.isPending}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#2563eb', '#1d4ed8']}
            style={styles.loginBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>New resident?</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity
          style={[styles.registerBtn, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' }]}
          onPress={() => router.push('/register')}
          activeOpacity={0.85}
        >
          <Text style={[styles.registerBtnText, { color: colors.primary }]}>Create an Account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: '#f8fafc' },
  hero: {
    height: SCREEN_HEIGHT * 0.32,
    justifyContent: 'flex-end',
    paddingBottom: 40,
    paddingHorizontal: 28,
    ...(Platform.OS === 'web' ? { height: 220 } : {}),
  },
  heroContent: { alignItems: 'center' },
  logoRing: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: {
    flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -24, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, marginBottom: 24 },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fefce8', borderWidth: 1.5, borderColor: '#fde047',
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  pendingTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 2 },
  pendingDesc: { fontSize: 12, color: '#a16207', lineHeight: 17 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fecaca',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#dc2626' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 7 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 50, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, gap: 10,
  },
  inputIcon: {},
  inputText: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
  loginBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4, marginBottom: 20 },
  loginBtnGradient: {
    height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  registerBtn: {
    height: 50, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  registerBtnText: { fontSize: 15, fontWeight: '600' },
});
