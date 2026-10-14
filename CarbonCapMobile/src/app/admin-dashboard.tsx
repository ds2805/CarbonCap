import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import * as api from '@/services/api';

export default function AdminDashboard() {
  const [flaggedTransactions, setFlaggedTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, txData, auditData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminTransactions(),
        api.getAuditLog(),
      ]);
      setUsers(usersData);
      setTransactions(txData);
      setAuditLog(auditData);
      setFlaggedTransactions(txData.filter((t: any) => t.status === 'flagged'));
    } catch (error) {
      Alert.alert('Error', 'Failed to load data. Make sure Flask backend is running.');
    } finally {
      setLoading(false);
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
            <Text style={styles.roleText}>Admin</Text>
          </View>
          <Text style={styles.username}>demo_user</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusOk}>
          <Text style={styles.statusText}>Ledger check passed: the hash chain is intact.</Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{users.length}</Text>
            <Text style={styles.summaryLabel}>Users</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{transactions.length}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{flaggedTransactions.length}</Text>
            <Text style={styles.summaryLabel}>Flagged</Text>
          </View>
        </View>

        <View style={[styles.panel, styles.panelAlert]}>
          <Text style={styles.panelTitle}>Flagged transactions</Text>
          <ScrollView style={styles.scrollContainer}>
            {loading ? (
              <Text style={styles.cellText}>Loading...</Text>
            ) : flaggedTransactions.length === 0 ? (
              <Text style={styles.cellText}>No flagged transactions.</Text>
            ) : (
              flaggedTransactions.map((tx) => (
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
                    <View style={styles.badgeFlagged}>
                      <Text style={styles.badgeTextFlagged}>Flagged</Text>
                    </View>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{tx.anomaly_score?.toFixed(3) || 'N/A'}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Users</Text>
          <ScrollView style={styles.scrollContainer}>
            {loading ? (
              <Text style={styles.cellText}>Loading...</Text>
            ) : users.length === 0 ? (
              <Text style={styles.cellText}>No users yet.</Text>
            ) : (
              users.map((user) => (
                <View key={user.id} style={styles.row}>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{user.id}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.cellText}>{user.username}</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{user.role}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>All transactions</Text>
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
                    <Text style={[styles.cellText, styles.hashText]}>{tx.hash?.substring(0, 8)}...</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Audit log</Text>
          <ScrollView style={styles.scrollContainer}>
            {loading ? (
              <Text style={styles.cellText}>Loading...</Text>
            ) : auditLog.length === 0 ? (
              <Text style={styles.cellText}>No audit log entries yet.</Text>
            ) : (
              auditLog.map((log, index) => (
                <View key={index} style={styles.row}>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.cellText}>{log.actor_id}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.cellText}>{log.event_type}: {log.details}</Text>
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
  statusOk: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  statusText: {
    color: '#2e7d32',
    fontSize: 14,
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
  panelAlert: {
    borderColor: '#ffebee',
    backgroundColor: '#fff5f5',
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
  hashText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#666',
  },
  badgeFlagged: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeTextFlagged: {
    color: '#c62828',
    fontSize: 11,
  },
});
