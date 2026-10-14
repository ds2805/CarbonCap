import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import * as api from '@/services/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      const result = await api.login(username, password);
      if (result.success && result.user) {
        // Navigate to appropriate dashboard based on role
        if (result.user.role === 'Trader') {
          router.push('/trader-dashboard');
        } else if (result.user.role === 'Verifier') {
          router.push('/verifier-dashboard');
        } else if (result.user.role === 'Admin') {
          router.push('/admin-dashboard');
        }
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please make sure the Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sidePanel}>
          <Text style={styles.brand}>CarbonCap</Text>
          <View style={styles.sideContent}>
            <Text style={styles.sideTitle}>Every credit signed. Every trade chained.</Text>
            <Text style={styles.sideText}>Trade verified carbon credits on a ledger where tampering shows up.</Text>
            <View style={styles.chain}>
              <Text style={styles.chainText}>tx 1 prev 0000 hash a91f…3c</Text>
              <Text style={styles.chainText}>tx 2 prev a91f hash 4be7…d0</Text>
              <Text style={styles.chainText}>tx 3 prev 4be7 hash 77c2…19</Text>
            </View>
          </View>
          <Text style={styles.roles}>Trader · Verifier · Admin</Text>
        </View>

        <View style={styles.mainPanel}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Sign in</Text>
            <Text style={styles.formSub}>Use the account you registered for your role.</Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.switchText}>New here? Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sidePanel: {
    backgroundColor: '#1b5e20',
    padding: 32,
    paddingBottom: 48,
  },
  brand: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
  },
  sideContent: {
    marginBottom: 32,
  },
  sideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  sideText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 24,
  },
  chain: {
    marginTop: 24,
  },
  chainText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  roles: {
    fontSize: 14,
    color: 'white',
  },
  mainPanel: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  formContainer: {
    maxWidth: 400,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    textAlign: 'center',
    color: '#2e7d32',
    fontSize: 14,
  },
});
