import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { login, register } from '../lib/api';

type Tab = 'login' | 'signup';
type UserType = 'DJ' | 'VENUE';

export default function AuthScreen() {
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('DJ');

  async function handleLogin() {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login({ email: loginEmail, password: loginPassword });
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      setTimeout(() => {
        try { router.replace('/(tabs)' as any); } catch { router.push('/(tabs)' as any); }
      }, 100);
    } catch (err: unknown) {
      Alert.alert('Login failed', err instanceof Error ? err.message : 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    if (!firstName || !lastName || !signupEmail || !signupPassword) {
      Alert.alert('Missing fields', 'Please fill out all fields.');
      return;
    }
    setLoading(true);
    try {
      const user = await register({ firstName, lastName, email: signupEmail, password: signupPassword, userType });
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      setTimeout(() => {
        try { router.replace('/(tabs)' as any); } catch { router.push('/(tabs)' as any); }
      }, 100);
    } catch (err: unknown) {
      Alert.alert('Sign up failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logoCircle}>
              <Text style={s.logoIcon}>🎧</Text>
            </View>
            <Text style={s.brand}>Mix Match</Text>
            <Text style={s.subtitle}>The DJ Booking Marketplace</Text>
            <TouchableOpacity
              style={s.guestBtn}
              onPress={() => router.replace('/(tabs)' as any)}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={s.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
            <Text style={s.guestSub}>Browse DJs, booking information, messages overview, and subscription plans without an account.</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            {/* Tabs */}
            <View style={s.tabRow}>
              {(['login', 'signup'] as Tab[]).map(t => (
                <TouchableOpacity key={t} style={s.tabBtn} onPress={() => setTab(t)}>
                  <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                    {t === 'login' ? 'Login' : 'Sign Up'}
                  </Text>
                  {tab === t && <View style={s.tabUnderline} />}
                </TouchableOpacity>
              ))}
            </View>

            {tab === 'login' ? (
              <View style={s.form}>
                <View style={s.inputWrap}>
                  <Text style={s.inputIcon}>✉️</Text>
                  <TextInput style={s.input} placeholder="Email address" placeholderTextColor={Colors.textPlaceholder}
                    value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
                <View style={s.inputWrap}>
                  <Text style={s.inputIcon}>🔒</Text>
                  <TextInput style={s.input} placeholder="Password" placeholderTextColor={Colors.textPlaceholder}
                    value={loginPassword} onChangeText={setLoginPassword} secureTextEntry />
                </View>
                <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Login</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.form}>
                <View style={s.row}>
                  <View style={[s.inputWrap, s.halfInput]}>
                    <TextInput style={s.input} placeholder="First name" placeholderTextColor={Colors.textPlaceholder}
                      value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
                  </View>
                  <View style={[s.inputWrap, s.halfInput]}>
                    <TextInput style={s.input} placeholder="Last name" placeholderTextColor={Colors.textPlaceholder}
                      value={lastName} onChangeText={setLastName} autoCapitalize="words" />
                  </View>
                </View>
                <View style={s.inputWrap}>
                  <Text style={s.inputIcon}>✉️</Text>
                  <TextInput style={s.input} placeholder="Email address" placeholderTextColor={Colors.textPlaceholder}
                    value={signupEmail} onChangeText={setSignupEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
                <View style={s.inputWrap}>
                  <Text style={s.inputIcon}>🔒</Text>
                  <TextInput style={s.input} placeholder="Password" placeholderTextColor={Colors.textPlaceholder}
                    value={signupPassword} onChangeText={setSignupPassword} secureTextEntry />
                </View>
                <Text style={s.label}>I am a...</Text>
                <View style={s.typeRow}>
                  {(['DJ', 'VENUE'] as UserType[]).map(t => (
                    <TouchableOpacity key={t} style={[s.typeCard, userType === t && s.typeCardActive]} onPress={() => setUserType(t)}>
                      <Text style={s.typeIcon}>{t === 'DJ' ? '🎧' : '🏟️'}</Text>
                      <Text style={[s.typeLabel, userType === t && s.typeLabelActive]}>{t === 'DJ' ? 'DJ' : 'Venue'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={s.btn} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoIcon: { fontSize: 32 },
  brand: { fontSize: 32, fontWeight: '800', color: Colors.text, letterSpacing: 0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 18 },
  guestBtn: { borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, minWidth: 220, alignItems: 'center', backgroundColor: Colors.primaryMuted },
  guestBtnText: { color: Colors.primaryLight, fontWeight: '800', fontSize: 16 },
  guestSub: { color: Colors.textMuted, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 10, paddingHorizontal: 8 },
  card: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 24 },
  tabRow: { flexDirection: 'row', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, alignItems: 'center', paddingBottom: 12 },
  tabText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  tabUnderline: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, backgroundColor: Colors.primary, borderRadius: 1 },
  form: { gap: 14 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12, paddingHorizontal: 14, height: 52 },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, color: Colors.text, fontSize: 15 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: -6 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeCard: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.inputBorder, backgroundColor: Colors.inputBg },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  typeIcon: { fontSize: 20 },
  typeLabel: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  typeLabelActive: { color: Colors.primary },
});
