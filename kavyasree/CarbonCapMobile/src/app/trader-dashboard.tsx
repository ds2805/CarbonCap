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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as api from '@/services/api';
import { Credit, Transaction, User } from '@/services/api';
import { StatsCard } from '@/components/StatsCard';
import { StatusBadge } from '@/components/StatusBadge';
import { CreditPicker } from '@/components/CreditPicker';
import { UserPicker } from '@/components/UserPicker';
import { FraudCheckModal } from '@/components/FraudCheckModal';
import { HashChainVisualizer } from '@/components/HashChainVisualizer';

export default function TraderDashboard() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fraudModalVisible, setFraudModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [creditsData, txData, usersData, me] = await Promise.all([
        api.getTraderCredits(),
        api.getTraderTransactions(),
        api.getAllUsers(),
        api.getCurrentUser(),
      ]);
      setCredits(creditsData);
      setTransactions(txData);
      setUsers(usersData);
      setCurrentUser(me);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data from Flask backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleStartTransfer = () => {
    if (!selectedCredit) {
      Alert.alert('Selection Required', 'Please select a carbon credit to transfer.');
      return;
    }
    if (!selectedCredit.signed) {
      Alert.alert(
        'Credit Unsigned',
        'This carbon credit has not been verified and cryptographically signed by a Verifier yet. It cannot be traded.'
      );
      return;
    }
    if (!selectedBuyer) {
      Alert.alert('Selection Required', 'Please select a recipient buyer.');
      return;
    }
    if (currentUser && selectedBuyer.id === currentUser.id) {
      Alert.alert('Invalid Recipient', 'You cannot transfer a credit to yourself.');
      return;
    }

    setFraudModalVisible(true);
  };

  const handleFraudModalClose = (didSucceed: boolean) => {
    setFraudModalVisible(false);
    if (didSucceed) {
      setSelectedCredit(null);
      setSelectedBuyer(null);
      loadData();
    }
  };

  const handleLogout = async () => {
    await api.logout();
    router.replace('/login');
  };

  const signedCount = credits.filter((c) => c.signed).length;
  const unsignedCount = credits.filter((c) => !c.signed).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandEmoji}>🌿</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Carbon<Text style={styles.brandAccent}>Cap</Text></Text>
            <Text style={styles.roleTitle}>TRADER WORKSPACE</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <View style={styles.userChip}>
            <Text style={styles.userChipText}>{currentUser?.username || 'Trader'}</Text>
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
        {/* Metric Cards Grid */}
        <View style={styles.statsGrid}>
          <StatsCard label="Owned Credits" value={credits.length} icon="🌿" color="green" />
          <StatsCard label="Signed & Valid" value={signedCount} icon="🔐" color="blue" />
          <StatsCard label="Unsigned" value={unsignedCount} icon="⏳" color="amber" />
          <StatsCard label="Transactions" value={transactions.length} icon="⛓️" color="purple" />
        </View>

        {/* Blockchain Visualizer */}
        <HashChainVisualizer transactions={transactions} />

        {/* Transfer Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Transfer Credit</Text>
            <View style={styles.shieldBadge}>
              <Text style={styles.shieldText}>🛡️ Fraud Protected</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>
            Select an authenticated credit and counterparty to trigger multi-layered fraud checks.
          </Text>

          <View style={styles.transferForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Owned Credit</Text>
              <CreditPicker
                credits={credits}
                selectedCreditId={selectedCredit?.id || null}
                onSelectCredit={(c) => setSelectedCredit(c)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Recipient Buyer</Text>
              <UserPicker
                users={users}
                selectedUserId={selectedBuyer?.id || null}
                onSelectUser={(u) => setSelectedBuyer(u)}
                excludeUserId={currentUser?.id}
                label="Choose buyer from network"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.transferBtn,
                (!selectedCredit || !selectedBuyer || !selectedCredit.signed) &&
                  styles.transferBtnDisabled,
              ]}
              onPress={handleStartTransfer}
              activeOpacity={0.8}
            >
              <Text style={styles.transferBtnText}>Execute Secure Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Credit Portfolio */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>My Portfolio ({credits.length})</Text>
          </View>

          {loading ? (
            <ActivityIndicator style={{ padding: 20 }} color="#15803d" />
          ) : credits.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyText}>No credits owned yet.</Text>
            </View>
          ) : (
            <View style={styles.portfolioList}>
              {credits.map((c) => (
                <View key={c.id} style={styles.creditCard}>
                  <View style={styles.creditHeader}>
                    <Text style={styles.creditId}>Credit #{c.id}</Text>
                    <StatusBadge status={c.signed ? 'signed' : 'unsigned'} size="sm" />
                  </View>
                  <Text style={styles.creditOrigin}>{c.origin}</Text>
                  {c.signed && c.signature ? (
                    <View style={styles.sigWrap}>
                      <Text style={styles.sigLabel}>HMAC SIGNATURE:</Text>
                      <Text style={styles.sigCode} numberOfLines={1}>
                        {c.signature}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.unsigNotice}>⚠️ Cannot trade until signed by Verifier</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Transaction History */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Transaction Ledger ({transactions.length})</Text>
          </View>

          {loading ? (
            <ActivityIndicator style={{ padding: 20 }} color="#15803d" />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📜</Text>
              <Text style={styles.emptyText}>No transactions recorded.</Text>
            </View>
          ) : (
            <View style={styles.txList}>
              {transactions.map((tx) => (
                <View key={tx.id} style={styles.txCard}>
                  <View style={styles.txHeader}>
                    <Text style={styles.txId}>Tx #{tx.id}</Text>
                    <StatusBadge status={tx.status} size="sm" />
                  </View>
                  <View style={styles.txMetaRow}>
                    <Text style={styles.txMeta}>Credit: #{tx.credit_id}</Text>
                    <Text style={styles.txMeta}>
                      {tx.sender_id === currentUser?.id ? 'Sent ➔' : 'Received ⬅'}
                    </Text>
                  </View>
                  {tx.hash && (
                    <Text style={styles.txHash} numberOfLines={1}>
                      Hash: {tx.hash}
                    </Text>
                  )}
                  {tx.anomaly_score !== undefined && tx.anomaly_score !== null && (
                    <Text style={styles.txAnomaly}>
                      ML Anomaly Score: {tx.anomaly_score.toFixed(3)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fraud Pipeline Modal */}
      {selectedCredit && selectedBuyer && (
        <FraudCheckModal
          visible={fraudModalVisible}
          creditId={selectedCredit.id}
          receiverId={selectedBuyer.id}
          receiverUsername={selectedBuyer.username}
          onClose={handleFraudModalClose}
        />
      )}
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
    backgroundColor: '#15803d',
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
    color: '#15803d',
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
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  userChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 16,
  },
  shieldBadge: {
    backgroundColor: '#dcfce7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  shieldText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  transferForm: {
    gap: 12,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  transferBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  transferBtnDisabled: {
    opacity: 0.5,
  },
  transferBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  portfolioList: {
    gap: 10,
  },
  creditCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  creditId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  creditOrigin: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  sigWrap: {
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  sigLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  sigCode: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#334155',
  },
  unsigNotice: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  txList: {
    gap: 10,
  },
  txCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  txId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  txMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  txMeta: {
    fontSize: 12,
    color: '#475569',
  },
  txHash: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  txAnomaly: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
    marginTop: 2,
  },
});
