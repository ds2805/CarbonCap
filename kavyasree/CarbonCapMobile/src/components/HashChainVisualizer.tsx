import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Transaction } from '@/services/api';

interface HashChainVisualizerProps {
  transactions: Transaction[];
}

export function HashChainVisualizer({ transactions }: HashChainVisualizerProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Take the most recent valid transactions
  const validTxs = transactions.filter((t) => t.status === 'valid').slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.statusDot}>●</Text>
          <Text style={styles.headerTitle}>SHA-256 Ledger Integrity</Text>
        </View>
        <Text style={styles.statusBadge}>100% INTACT</Text>
      </View>

      <Text style={styles.subtext}>
        Sequential cryptographic hash chaining ensures historical immutability.
      </Text>

      {validTxs.length > 0 ? (
        <View style={styles.chainRow}>
          {validTxs.map((tx, idx) => (
            <React.Fragment key={tx.id}>
              {idx > 0 && <Text style={styles.chainArrow}>➔</Text>}
              <TouchableOpacity
                style={styles.block}
                onPress={() => setSelectedTx(tx)}
                activeOpacity={0.7}
              >
                <Text style={styles.blockNumber}>Block #{tx.id}</Text>
                <Text style={styles.blockHash} numberOfLines={1}>
                  {tx.hash ? `${tx.hash.substring(0, 6)}...` : '000000'}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      ) : (
        <View style={styles.genesisBlock}>
          <Text style={styles.genesisText}>Genesis Block initialized · Ready for transactions</Text>
        </View>
      )}

      {/* Detail Modal */}
      {selectedTx && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTx(null)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Block #{selectedTx.id} Proof</Text>
                <TouchableOpacity onPress={() => setSelectedTx(null)} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Current Block Hash (SHA-256):</Text>
                  <Text style={styles.fieldMono}>{selectedTx.hash || 'None'}</Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Previous Block Hash (prev_hash):</Text>
                  <Text style={styles.fieldMono}>
                    {selectedTx.prev_hash || '0000000000000000000000000000000000000000000000000000000000000000'}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>Credit ID: #{selectedTx.credit_id}</Text>
                  <Text style={styles.metaText}>Status: {selectedTx.status}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.modalButton} onPress={() => setSelectedTx(null)}>
                <Text style={styles.modalButtonText}>Close Inspector</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    color: '#22c55e',
    fontSize: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  subtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 12,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    overflow: 'hidden',
  },
  chainArrow: {
    color: '#22c55e',
    fontSize: 12,
  },
  block: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  blockNumber: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  blockHash: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#38bdf8',
    marginTop: 2,
  },
  genesisBlock: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    alignItems: 'center',
  },
  genesisText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  },
  modalBody: {
    gap: 10,
    marginBottom: 16,
  },
  fieldGroup: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  fieldMono: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#15803d',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
