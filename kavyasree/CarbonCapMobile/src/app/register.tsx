import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as api from '@/services/api';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Trader' | 'Verifier' | 'Admin'>('Trader');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both username and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.register(username.trim(), password, role);
      if (result.success) {
        Alert.alert(
          'Account Created!',
          `Your ${role} account has been registered. You can now sign in.`,
          [{ text: 'Sign In', onPress: () => router.replace('/login') }]
        );
      } else {
        Alert.alert('Registration Failed', result.error || 'Could not register account.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Make sure the Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🌿</Text>
            </View>
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.tagline}>Select your role in the CarbonCap ecosystem</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a username"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Choose a password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>

            {/* Role Selection Cards */}
            <Text style={styles.label}>Designated Network Role</Text>
            <View style={styles.roleCardsContainer}>
              <TouchableOpacity
                style={[styles.roleCard, role === 'Trader' && styles.roleCardActive]}
                onPress={() => setRole('Trader')}
                activeOpacity={0.8}
              >
                <View style={styles.roleCardHeader}>
                  <Text style={styles.roleIcon}>⚖️</Text>
                  <Text style={[styles.roleTitle, role === 'Trader' && styles.roleTextActive]}>Trader</Text>
                </View>
                <Text style={styles.roleDesc}>
                  Trade, hold, and transfer verified carbon credits across market counterparties.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, role === 'Verifier' && styles.roleCardActive]}
                onPress={() => setRole('Verifier')}
                activeOpacity={0.8}
              >
                <View style={styles.roleCardHeader}>
                  <Text style={styles.roleIcon}>🔐</Text>
                  <Text style={[styles.roleTitle, role === 'Verifier' && styles.roleTextActive]}>Verifier</Text>
                </View>
                <Text style={styles.roleDesc}>
                  Validate project origins against global registries and generate HMAC-SHA256 signatures.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, role === 'Admin' && styles.roleCardActive]}
                onPress={() => setRole('Admin')}
                activeOpacity={0.8}
              >
                <View style={styles.roleCardHeader}>
                  <Text style={styles.roleIcon}>🛡️</Text>
                  <Text style={[styles.roleTitle, role === 'Admin' && styles.roleTextActive]}>Admin</Text>
                </View>
                <Text style={styles.roleDesc}>
                  Monitor ledger integrity, review ML anomaly detections, and inspect tamper-evident audit trails.
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>Register as {role}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => router.back()}
            >
              <Text style={styles.switchText}>
                Already have an account? <Text style={styles.switchHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 24,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  tagline: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  roleCardsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  roleCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  roleCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#15803d',
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleIcon: {
    fontSize: 16,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  roleTextActive: {
    color: '#15803d',
  },
  roleDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  registerButton: {
    backgroundColor: '#15803d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  switchRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 13,
    color: '#64748b',
  },
  switchHighlight: {
    color: '#15803d',
    fontWeight: '700',
  },
});
