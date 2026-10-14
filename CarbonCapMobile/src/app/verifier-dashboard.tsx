import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import * as api from '@/services/api';

export default function VerifierDashboard() {
  const [waitingCredits, setWaitingCredits] = useState<any[]>([]);
  const [signedCredits, setSignedCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getVerifierCredits();
      setWaitingCredits(data.unsigned || []);
      setSignedCredits(data.signed || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data. Make sure Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (creditId: number) => {
    setSigning(creditId);
    try {
      const result = await api.signCredit(creditId);
      if (result.success) {
        Alert.alert('Success', 'Credit signed successfully!');
        loadData(); // Refresh data
      } else {
        Alert.alert('Signing Failed', result.error || 'Could not sign credit');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Make sure Flask backend is running.');
    } finally {
      setSigning(null);
    }
  };

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.brand}>CarbonCap</Text>
        <View style={styles.topbarCenter}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Verifier</Text>
          </View>
          <Text style={styles.username}>demo_user</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{waitingCredits.length}</Text>
            <Text style={styles.summaryLabel}>Waiting for signature</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{signedCredits.length}</Text>
            <Text style={styles.summaryLabel}>Signed credits</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Credits waiting for verification</Text>
          <ScrollView style={styles.scrollContainer}>
            {loading ? (
              <Text style={styles.cellText}>Loading...</Text>
            ) : waitingCredits.length === 0 ? (
              <Text style={styles.cellText}>No credits waiting for signature.</Text>
            ) : (
              waitingCredits.map((credit) => (
                <View key={credit.id} style={styles.row}>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{credit.id}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.cellText}>{credit.origin || 'Unknown'}</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{credit.owner_id}</Text>
                  </View>
                  <View style={styles.cell}>
                    <TouchableOpacity
                      style={styles.signButton}
                      onPress={() => handleSign(credit.id)}
                      disabled={signing === credit.id}
                    >
                      <Text style={styles.signButtonText}>
                        {signing === credit.id ? 'Signing...' : 'Sign credit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Signed credits</Text>
          <ScrollView style={styles.scrollContainer}>
            {loading ? (
              <Text style={styles.cellText}>Loading...</Text>
            ) : signedCredits.length === 0 ? (
              <Text style={styles.cellText}>No signed credits yet.</Text>
            ) : (
              signedCredits.map((credit) => (
                <View key={credit.id} style={styles.row}>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{credit.id}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.cellText}>{credit.origin || 'Unknown'}</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{credit.owner_id}</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.hashText}>{credit.signature?.substring(0, 8)}...</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topbar: {
    backgroundColor: '#2e7d32',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  topbarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
  },
  username: {
    color: 'white',
    fontSize: 14,
  },
  logout: {
    color: 'white',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summary: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#666',
    fontSize: 12,
  },
  panel: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scrollContainer: {
    maxHeight: 200,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  cellText: {
    fontSize: 12,
  },
  hashText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#666',
  },
  signButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  signButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
