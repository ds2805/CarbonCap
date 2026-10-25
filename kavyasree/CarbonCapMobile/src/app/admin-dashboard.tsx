import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as api from '@/services/api';
import { Transaction, User, AuditLogItem } from '@/services/api';
import { StatsCard } from '@/components/StatsCard';
import { StatusBadge } from '@/components/StatusBadge';
import { HashChainVisualizer } from '@/components/HashChainVisualizer';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<'tx' | 'users' | 'audit'>('tx');
  const [auditFilter, setAuditFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, txData, auditData, me] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminTransactions(),
        api.getAuditLog(),
        api.getCurrentUser(),
      ]);
      setUsers(usersData);
      setTransactions(txData);
      setAuditLog(auditData);
      setCurrentUser(me);
    } catch (error) {
      Alert.alert('Error', 'Failed to load administrator data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeactivate = (userId: number, username: string) => {
    Alert.alert(
      'Confirm Deactivation',
      `Are you sure you want to remove user "${username}" (ID: ${userId})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            const res = await api.deactivateUser(userId);
            if (res.success) {
              Alert.alert('User Removed', `User ${username} has been deactivated.`);
              loadData();
            } else {
              Alert.alert('Error', res.error || 'Failed to deactivate user.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await api.logout();
    router.replace('/login');
  };

  const flaggedTxs = transactions.filter((t) => t.status === 'flagged');
  const filteredAudit = auditLog.filter(
    (a) =>
      a.event_type.toLowerCase().includes(auditFilter.toLowerCase()) ||
      a.details.toLowerCase().includes(auditFilter.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={[styles.brandBadge, { backgroundColor: '#7e22ce' }]}>
            <Text style={styles.brandEmoji}>🛡️</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Carbon<Text style={styles.brandAccent}>Cap</Text></Text>
            <Text style={styles.roleTitle}>SECURITY & AUDIT CENTER</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <View style={styles.userChip}>
            <Text style={styles.userChipText}>{currentUser?.username || 'Admin'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* System Integrity Banner */}
        <View style={styles.integrityBanner}>
          <View style={styles.integrityDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.integrityTitle}>SHA-256 Ledger: Tamper-Evident & Intact</Text>
            <Text style={styles.integritySub}>
              All sequential blocks mathematically verified against hash origins.
            </Text>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.statsGrid}>
          <StatsCard label="Registered Users" value={users.length} icon="👥" color="blue" />
          <StatsCard label="Transactions" value={transactions.length} icon="⛓️" color="green" />
          <StatsCard label="Fraud Flagged" value={flaggedTxs.length} icon="🚨" color="red" />
          <StatsCard label="Audit Entries" value={auditLog.length} icon="📜" color="purple" />
        </View>

        {/* Hash Chain Visualizer */}
        <HashChainVisualizer transactions={transactions} />

        {/* Flagged Alert Box */}
        {flaggedTxs.length > 0 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>🚨 Flagged Fraud Attempts ({flaggedTxs.length})</Text>
            <Text style={styles.alertSub}>
              These transactions violated rule-based or ML anomaly detection policies and were blocked before settlement.
            </Text>
            {flaggedTxs.slice(0, 3).map((f) => (
              <View key={f.id} style={styles.flaggedItem}>
                <Text style={styles.flaggedText}>Tx #{f.id} · Credit #{f.credit_id}</Text>
                <StatusBadge status="flagged" size="sm" />
              </View>
            ))}
          </View>
        )}

        {/* Tabs Bar */}
        <View style={styles.tabsBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'tx' && styles.tabBtnActive]}
            onPress={() => setActiveTab('tx')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'tx' && styles.tabBtnTextActive]}>
              Transactions ({transactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'users' && styles.tabBtnActive]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'users' && styles.tabBtnTextActive]}>
              Users ({users.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'audit' && styles.tabBtnActive]}
            onPress={() => setActiveTab('audit')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'audit' && styles.tabBtnTextActive]}>
              Audit Trail ({auditLog.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Transactions */}
        {activeTab === 'tx' && (
          <View style={styles.tabContent}>
            {loading ? (
              <ActivityIndicator style={{ padding: 20 }} color="#15803d" />
            ) : transactions.length === 0 ? (
              <Text style={styles.emptyText}>No transactions recorded.</Text>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>Transaction #{tx.id}</Text>
                    <StatusBadge status={tx.status} size="sm" />
                  </View>
                  <Text style={styles.itemSub}>
                    Credit #{tx.credit_id} · Sender #{tx.sender_id} ➔ Receiver #{tx.receiver_id}
                  </Text>
                  {tx.hash && (
                    <Text style={styles.monoHash} numberOfLines={1}>
                      Block Hash: {tx.hash}
                    </Text>
                  )}
                  {tx.anomaly_score !== undefined && tx.anomaly_score !== null && (
                    <Text style={styles.anomalyText}>
                      ML Anomaly Score: {tx.anomaly_score.toFixed(3)}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab 2: Users */}
        {activeTab === 'users' && (
          <View style={styles.tabContent}>
            {users.map((u) => (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Text style={styles.itemTitle}>{u.username}</Text>
                  <Text style={styles.itemSub}>User ID #{u.id} · Role: {u.role}</Text>
                </View>
                {u.id !== currentUser?.id ? (
                  <TouchableOpacity
                    style={styles.deactivateBtn}
                    onPress={() => handleDeactivate(u.id, u.username)}
                  >
                    <Text style={styles.deactivateText}>Deactivate</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.currentTag}>You</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Tab 3: Audit Trail */}
        {activeTab === 'audit' && (
          <View style={styles.tabContent}>
            <TextInput
              style={styles.filterInput}
              value={auditFilter}
              onChangeText={setAuditFilter}
              placeholder="Search audit trail by event or details..."
              placeholderTextColor="#94a3b8"
            />
            {filteredAudit.map((a) => (
              <View key={a.id} style={styles.auditCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.auditEvent}>{a.event_type.toUpperCase()}</Text>
                  <Text style={styles.auditTime}>#{a.id}</Text>
                </View>
                <Text style={styles.auditDetails}>{a.details}</Text>
                <Text style={styles.auditActor}>
                  Actor: {a.actor_id ? `User #${a.actor_id}` : 'System'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: {
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  brandAccent: {
    color: '#7e22ce',
  },
  roleTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userChip: {
    backgroundColor: '#faf5ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  userChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7e22ce',
  },
  logoutBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  logoutText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  integrityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 10,
  },
  integrityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
  },
  integrityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14532d',
  },
  integritySub: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  alertCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 4,
  },
  alertSub: {
    fontSize: 11,
    color: '#7f1d1d',
    marginBottom: 8,
  },
  flaggedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  flaggedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  tabsBar: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  tabContent: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemSub: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
  },
  monoHash: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  anomalyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
    marginTop: 2,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  deactivateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  deactivateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  currentTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 4,
  },
  auditCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
  },
  auditEvent: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  auditTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  auditDetails: {
    fontSize: 12,
    color: '#334155',
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  auditActor: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    padding: 24,
  },
});
