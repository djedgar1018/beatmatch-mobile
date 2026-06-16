import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { login, register } from '../lib/api';

type Tab = 'login' | 'signup';
type UserType = 'DJ' | 'VENUE';

export default function AuthScreen() {
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
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
      if ((user as any).apiToken) await AsyncStorage.setItem('api_token', (user as any).apiToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      // Small delay to ensure storage write completes before navigation
      setTimeout(() => {
        try {
          router.replace('/(tabs)' as any);
        } catch (navErr) {
          router.push('/(tabs)' as any);
        }
      }, 100);
    } catch (err: unknown) {
      Alert.alert('Login failed', err instanceof Error ? err.message : 'Please check your credentials and try again.');
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
      const user = await register({
        firstName,
        lastName,
        email: signupEmail,
        password: signupPassword,
        userType,
      });
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      setTimeout(() => {
        try {
          router.replace('/(tabs)' as any);
        } catch (navErr) {
          router.push('/(tabs)' as any);
        }
      }, 100);
    } catch (err: unknown) {
      Alert.alert('Sign up failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#3b0764', '#0a0a0a']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo / Brand */}
            <View style={styles.brandRow}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoIcon}>🎧</Text>
              </View>
              <Text style={styles.brandName}>Mix-Match</Text>
              <Text style={styles.brandSub}>The DJ Booking Marketplace</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {/* Tab switcher */}
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
                  onPress={() => setTab('login')}
                >
                  <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                    Login
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'signup' && styles.tabBtnActive]}
                  onPress={() => setTab('signup')}
                >
                  <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {tab === 'login' ? (
                <View style={styles.form}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={Colors.placeholder}
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={Colors.placeholder}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry
                  />
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[Colors.primary, Colors.primaryDark]}
                      style={styles.submitGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitText}>Login</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.form}>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="First name"
                      placeholderTextColor={Colors.placeholder}
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Last name"
                      placeholderTextColor={Colors.placeholder}
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={Colors.placeholder}
                    value={signupEmail}
                    onChangeText={setSignupEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={Colors.placeholder}
                    value={signupPassword}
                    onChangeText={setSignupPassword}
                    secureTextEntry
                  />

                  {/* User type picker */}
                  <Text style={styles.label}>I am a...</Text>
                  <View style={styles.userTypeRow}>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        userType === 'DJ' && styles.typeBtnActive,
                      ]}
                      onPress={() => setUserType('DJ')}
                    >
                      <Text style={styles.typeBtnIcon}>🎧</Text>
                      <Text
                        style={[
                          styles.typeBtnText,
                          userType === 'DJ' && styles.typeBtnTextActive,
                        ]}
                      >
                        DJ
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        userType === 'VENUE' && styles.typeBtnActive,
                      ]}
                      onPress={() => setUserType('VENUE')}
                    >
                      <Text style={styles.typeBtnIcon}>🏟️</Text>
                      <Text
                        style={[
                          styles.typeBtnText,
                          userType === 'VENUE' && styles.typeBtnTextActive,
                        ]}
                      >
                        Venue
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSignup}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[Colors.primary, Colors.primaryDark]}
                      style={styles.submitGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitText}>Create Account</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: { fontSize: 32 },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  tabTextActive: { color: '#fff' },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  halfInput: { flex: 1 },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: -6,
  },
  userTypeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.inputBg,
  },
  typeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}22`,
  },
  typeBtnIcon: { fontSize: 20 },
  typeBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  typeBtnTextActive: { color: Colors.primary },
  submitBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
