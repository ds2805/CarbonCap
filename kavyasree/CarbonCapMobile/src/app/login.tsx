import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as api from '@/services/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [serverUrl, setServerUrl] = useState(api.getApiBaseUrl());

  useEffect(() => {
    setServerUrl(api.getApiBaseUrl());
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.login(username.trim(), password);
      if (result.success && result.user) {
        if (result.user.role === 'Trader') {
          router.replace('/trader-dashboard');
        } else if (result.user.role === 'Verifier') {
          router.replace('/verifier-dashboard');
        } else if (result.user.role === 'Admin') {
          router.replace('/admin-dashboard');
        } else {
          router.replace('/trader-dashboard');
        }
      } else {
        Alert.alert('Sign In Failed', result.error || 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert('Connection Error', error.message || 'Make sure the Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  const handleSaveServer = () => {
    api.setApiBaseUrl(serverUrl);
    setServerModalVisible(false);
    Alert.alert('Server Updated', `API server set to: ${serverUrl}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🌿</Text>
            </View>
            <Text style={styles.appName}>Carbon<Text style={styles.appNameAccent}>Cap</Text></Text>
            <Text style={styles.tagline}>Every credit signed. Every trade chained.</Text>
          </View>

          {/* Quick Demo Credentials */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>QUICK DEMO ACCOUNTS (TAP TO FILL)</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleQuickDemo('trader1', 'password123')}
              >
                <Text style={styles.demoBtnText}>⚖️ trader1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleQuickDemo('trader2', 'password123')}
              >
                <Text style={styles.demoBtnText}>⚖️ trader2</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleQuickDemo('verifier1', 'password123')}
              >
                <Text style={styles.demoBtnText}>🔐 verifier1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleQuickDemo('admin1', 'password123')}
              >
                <Text style={styles.demoBtnText}>🛡️ admin1</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign in to your account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.switchText}>
                Need an account? <Text style={styles.switchHighlight}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Server Config Settings Pill */}
          <TouchableOpacity
            style={styles.serverPill}
            onPress={() => setServerModalVisible(true)}
          >
            <Text style={styles.serverPillText}>
              ⚙️ Server: {api.getApiBaseUrl()}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Server Config Modal */}
        <Modal
          visible={serverModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setServerModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.serverCard}>
              <Text style={styles.serverModalTitle}>Configure Flask Backend URL</Text>
              <Text style={styles.serverModalSub}>
                Set the IP address of your host machine running app.py on port 5001.
              </Text>
              <TextInput
                style={styles.serverInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.6:5001"
                autoCapitalize="none"
              />
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#f1f5f9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' }}
                  onPress={() => setServerUrl('http://192.168.1.6:5001')}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#15803d' }}>Wi-Fi: 192.168.1.6:5001</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: '#f1f5f9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' }}
                  onPress={() => setServerUrl('http://127.0.0.1:5001')}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b' }}>localhost:5001</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.serverModalButtons}>
                <TouchableOpacity
                  style={styles.serverBtnCancel}
                  onPress={() => setServerModalVisible(false)}
                >
                  <Text style={styles.serverBtnTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.serverBtnSave}
                  onPress={handleSaveServer}
                >
                  <Text style={styles.serverBtnTextSave}>Save URL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  logoEmoji: {
    fontSize: 28,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  appNameAccent: {
    color: '#15803d',
  },
  tagline: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  demoSection: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
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
  loginButton: {
    backgroundColor: '#15803d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
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
  serverPill: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
  },
  serverPillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  serverCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  serverModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  serverModalSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  serverInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
  },
  serverModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  serverBtnCancel: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  serverBtnTextCancel: {
    color: '#475569',
    fontWeight: '700',
  },
  serverBtnSave: {
    flex: 1,
    padding: 12,
    backgroundColor: '#15803d',
    borderRadius: 8,
    alignItems: 'center',
  },
  serverBtnTextSave: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
