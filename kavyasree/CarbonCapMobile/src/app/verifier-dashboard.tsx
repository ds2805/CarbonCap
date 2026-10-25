import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { Credit, User } from '@/services/api';
import { StatsCard } from '@/components/StatsCard';
import { StatusBadge } from '@/components/StatusBadge';
import { UserPicker } from '@/components/UserPicker';
import { VerificationChecklistModal } from '@/components/VerificationChecklistModal';

export default function VerifierDashboard() {
  const [waitingCredits, setWaitingCredits] = useState<Credit[]>([]);
  const [signedCredits, setSignedCredits] = useState<Credit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [newOwnerId, setNewOwnerId] = useState<number | null>(null);
  const [newOrigin, setNewOrigin] = useState('');
  const [submittingCredit, setSubmittingCredit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Verification modal state
  const [activeCreditToVerify, setActiveCreditToVerify] = useState<Credit | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [creditsData, usersData, me] = await Promise.all([
        api.getVerifierCredits(),
        api.getAllUsers(),
        api.getCurrentUser(),
      ]);
      setWaitingCredits(creditsData.unsigned || []);
      setSignedCredits(creditsData.signed || []);
      setUsers(usersData);
      setCurrentUser(me);
    } catch (error) {
      Alert.alert('Error', 'Failed to load verifier data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleVerifyPress = (credit: Credit) => {
    setActiveCreditToVerify(credit);
  };

  const handleVerificationModalClose = (didSucceed: boolean) => {
    setActiveCreditToVerify(null);
    if (didSucceed) {
      loadData();
    }
  };

  const handleCreateNewCredit = async () => {
    if (!newOwnerId || !newOrigin.trim()) {
      Alert.alert('Missing Fields', 'Please select a trader and enter a project origin.');
      return;
    }

    setSubmittingCredit(true);
    try {
      const res = await api.submitCredit(newOwnerId, newOrigin.trim());
      if (res.success && res.status === 'signed') {
        Alert.alert('Credit Authenticated & Signed!', `Credit #${res.credit_id} origin verified and signed.`);
        setNewOrigin('');
        loadData();
      } else {
        Alert.alert('Origin Rejected', res.reason || res.error || 'Verification checks failed.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Submission failed');
    } finally {
      setSubmittingCredit(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={[styles.brandBadge, { backgroundColor: '#0284c7' }]}>
            <Text style={styles.brandEmoji}>🔐</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Carbon<Text style={styles.brandAccent}>Cap</Text></Text>
            <Text style={styles.roleTitle}>VERIFIER AUTHORITY</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <View style={styles.userChip}>
            <Text style={styles.userChipText}>{currentUser?.username || 'Verifier'}</Text>
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
        {/* Metric Cards */}
        <View style={styles.statsGrid}>
          <StatsCard label="Awaiting Signature" value={waitingCredits.length} icon="⏳" color="amber" />
          <StatsCard label="Signed & Verified" value={signedCredits.length} icon="✓" color="green" />
          <StatsCard label="Recognized Registries" value={5} icon="🏛️" color="blue" />
          <StatsCard label="Algorithm" value="HMAC" icon="🔐" color="purple" />
        </View>

        {/* Register New Credit Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Submit & Sign New Credit</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Issue a newly authenticated carbon project origin on behalf of a network trader.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Select Trader Owner</Text>
            <UserPicker
              users={users}
              selectedUserId={newOwnerId}
              onSelectUser={(u) => setNewOwnerId(u.id)}
              label="Select Trader Assignee"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Project Origin (Registry:ProjectID)</Text>
            <TextInput
              style={styles.input}
              value={newOrigin}
              onChangeText={setNewOrigin}
              placeholder="e.g. Verra:VCS-1548-2023"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
            />
          </View>

          {/* Quick Origin Presets */}
          <Text style={styles.presetLabel}>Quick Presets:</Text>
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={styles.presetPill}
              onPress={() => setNewOrigin('Verra:VCS-1982-2024')}
            >
              <Text style={styles.presetText}>Verra:VCS-1982</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetPill}
              onPress={() => setNewOrigin('Gold Standard:GS-3490-2024')}
            >
              <Text style={styles.presetText}>GS-3490</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetPill}
              onPress={() => setNewOrigin('Climate Action Reserve:CAR-6101-2024')}
            >
              <Text style={styles.presetText}>CAR-6101</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submittingCredit && styles.submitBtnDisabled]}
            disabled={submittingCredit}
            onPress={handleCreateNewCredit}
            activeOpacity={0.8}
          >
            {submittingCredit ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit & Sign Credit</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Verification Queue (Unsigned Credits) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Unsigned Queue ({waitingCredits.length})</Text>
            <StatusBadge status="unsigned" size="sm" />
          </View>

          {loading ? (
            <ActivityIndicator style={{ padding: 20 }} color="#0284c7" />
          ) : waitingCredits.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>✨</Text>
              <Text style={styles.emptyText}>All submitted credits are signed!</Text>
            </View>
          ) : (
            <View style={styles.queueList}>
              {waitingCredits.map((credit) => (
                <View key={credit.id} style={styles.creditItem}>
                  <View style={styles.creditInfo}>
                    <Text style={styles.creditId}>Credit #{credit.id}</Text>
                    <Text style={styles.creditOrigin}>{credit.origin}</Text>
                    <Text style={styles.creditOwner}>Owner: User #{credit.owner_id}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.signButton}
                    onPress={() => handleVerifyPress(credit)}
                  >
                    <Text style={styles.signButtonText}>Verify & Sign</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Signed Credits Ledger */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Signed Credits ({signedCredits.length})</Text>
            <StatusBadge status="signed" size="sm" />
          </View>

          {loading ? (
            <ActivityIndicator style={{ padding: 20 }} color="#0284c7" />
          ) : signedCredits.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No signed credits yet.</Text>
            </View>
          ) : (
            <View style={styles.queueList}>
              {signedCredits.map((credit) => (
                <View key={credit.id} style={styles.creditItem}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={styles.creditId}>Credit #{credit.id}</Text>
                      <StatusBadge status="signed" size="sm" />
                    </View>
                    <Text style={styles.creditOrigin}>{credit.origin}</Text>
                    {credit.signature && (
                      <Text style={styles.sigText} numberOfLines={1}>
                        HMAC: {credit.signature}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Verification Step-by-Step Modal */}
      {activeCreditToVerify && (
        <VerificationChecklistModal
          visible={true}
          creditId={activeCreditToVerify.id}
          origin={activeCreditToVerify.origin}
          ownerId={activeCreditToVerify.owner_id}
          onClose={handleVerificationModalClose}
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
    color: '#0284c7',
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
    backgroundColor: '#f0f9ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  userChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
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
    marginBottom: 8,
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
  },
  formGroup: {
    marginBottom: 12,
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
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
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetPill: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  queueList: {
    gap: 10,
  },
  creditItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditInfo: {
    flex: 1,
    marginRight: 10,
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
    marginTop: 2,
  },
  creditOwner: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  signButton: {
    backgroundColor: '#15803d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  signButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sigText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748b',
    marginTop: 4,
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
});
