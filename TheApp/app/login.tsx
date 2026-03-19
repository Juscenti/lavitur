import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import { Colors, Spacing, Typography } from '../constants/theme';

export default function LoginScreen() {
  const { signIn, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      // AuthContext + index.tsx will redirect
    } catch (e: any) {
      setError(e.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>L</Text>
          </View>
          <Text style={styles.brand}>LAVITÚR</Text>
          <Text style={styles.brandSub}>Admin Console</Text>
        </View>

        {/* Gold separator */}
        <View style={styles.goldBar} />

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Sign in</Text>
          <Text style={styles.formSubtitle}>Access restricted to admin & representatives</Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@lavitur.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginTop: Spacing.xl }}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.lg }}
          />
        </View>

        <Text style={styles.footer}>
          Only admin and representative accounts can access this console.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl, paddingBottom: 48 },
  logoArea: { alignItems: 'center', marginBottom: Spacing.xl },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoLetter: { fontSize: 32, fontWeight: '800', color: '#0A0A0F' },
  brand: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: 6 },
  brandSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  goldBar: { height: 1, backgroundColor: Colors.gold, opacity: 0.3, marginVertical: Spacing.xl },
  form: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  formTitle: { ...Typography.heading, color: Colors.text },
  formSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  errorBox: {
    backgroundColor: Colors.dangerDim,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: { color: Colors.danger, fontSize: 13 },
  footer: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl },
});
