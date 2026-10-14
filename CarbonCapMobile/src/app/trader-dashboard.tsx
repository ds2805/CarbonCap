import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import * as api from '@/services/api';

interface Credit {
  id: number;
  owner_id: number;
  origin: string;
  signed: boolean;
  signature?: string;
}

interface Transaction {
  id: number;
  credit_id: number;
  sender_id: number;
  receiver_id: number;
  status: string;
  timestamp: string;
  hash?: string;
  anomaly_score?: number;
}

export default function TraderDashboard() {
  const [creditId, setCreditId] = useState('');
  const [buyer, setBuyer] = useState('');
  const [credits, setCredits] = useState<Credit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [creditsData, txData, usersData] = await Promise.all([
        api.getTraderCredits(),
        api.getTraderTransactions(),
        api.getAllUsers(),
      ]);
      setCredits(creditsData);
      setTransactions(txData);
      setUsers(usersData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data. Make sure Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!creditId || !buyer) {
      Alert.alert('Error', 'Please enter credit ID and buyer username');
      return;
    }

    setTransferring(true);
    try {
      // Look up user ID by username
      const receiverUser = users.find((u: any) => u.username === buyer);
      if (!receiverUser) {
        Alert.alert('Error', 'User not found. Please check the username.');
        setTransferring(false);
        return;
      }

      const result = await api.submitTransaction(parseInt(creditId), receiverUser.id);
      if (result.success) {
        Alert.alert('Success', 'Transaction completed successfully!');
        setCreditId('');
        setBuyer('');
        loadData(); // Refresh data
      } else {
        Alert.alert('Transaction Failed', result.error || 'Could not complete transaction');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Make sure Flask backend is running.');
    } finally {
      setTransferring(false);
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
            <Text style={styles.roleText}>Trader</Text>
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
            <Text style={styles.summaryNumber}>{credits.length}</Text>
            <Text style={styles.summaryLabel}>Credits you own</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{transactions.length}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>My credits</Text>
          <ScrollView style={styles.scrollContainer}>
            {loading ? (
              <Text style={styles.cellText}>Loading...</Text>
            ) : credits.length === 0 ? (
              <Text style={styles.cellText}>No credits yet.</Text>
            ) : (
              credits.map((credit) => (
                <View key={credit.id} style={styles.row}>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{credit.id}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.cellText}>{credit.origin || 'Unknown'}</Text>
                  </View>
                  <View style={styles.cell}>
                    <View style={[
                      styles.badge,
                      credit.signed ? styles.badgeSigned : styles.badgeUnsigned
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        credit.signed ? styles.badgeTextSigned : styles.badgeTextUnsigned
                      ]}>
                        {credit.signed ? 'Signed' : 'Unsigned'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Transfer a credit</Text>
          <View style={styles.transferForm}>
            <View style={styles.formField}>
              <Text style={styles.label}>Credit ID</Text>
              <TextInput
                style={styles.input}
                value={creditId}
                onChangeText={setCreditId}
                placeholder="Enter credit ID"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.label}>Buyer username</Text>
              <TextInput
                style={styles.input}
                value={buyer}
                onChangeText={setBuyer}
                placeholder="Enter buyer username"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleTransfer} disabled={transferring}>
              <Text style={styles.buttonText}>{transferring ? 'Transferring...' : 'Transfer credit'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>My transactions</Text>
          <ScrollView style={styles.scrollContainer}>
            {loading ? (
              <Text style={styles.cellText}>Loading...</Text>
            ) : transactions.length === 0 ? (
              <Text style={styles.cellText}>No transactions yet.</Text>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.row}>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{tx.id}</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{tx.credit_id}</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{tx.sender_id}</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{tx.receiver_id}</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : ''}</Text>
                  </View>
                  <View style={styles.cell}>
                    <View style={[
                      styles.badge,
                      tx.status === 'valid' ? styles.badgeOk : styles.badgeFlagged
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        tx.status === 'valid' ? styles.badgeTextOk : styles.badgeTextFlagged
                      ]}>
                        {tx.status}
                      </Text>
                    </View>
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
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  cellText: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeSigned: {
    backgroundColor: '#e8f5e9',
  },
  badgeUnsigned: {
    backgroundColor: '#fff3e0',
  },
  badgeOk: {
    backgroundColor: '#e8f5e9',
  },
  badgeFlagged: {
    backgroundColor: '#ffebee',
  },
  badgeText: {
    fontSize: 11,
  },
  badgeTextSigned: {
    color: '#2e7d32',
  },
  badgeTextUnsigned: {
    color: '#e65100',
  },
  badgeTextOk: {
    color: '#2e7d32',
  },
  badgeTextFlagged: {
    color: '#c62828',
  },
  transferForm: {
    gap: 16,
  },
  formField: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
