import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Credit } from '@/services/api';
import { StatusBadge } from './StatusBadge';

interface CreditPickerProps {
  credits: Credit[];
  selectedCreditId: number | null;
  onSelectCredit: (credit: Credit) => void;
  filterSignedOnly?: boolean;
}

export function CreditPicker({
  credits,
  selectedCreditId,
  onSelectCredit,
  filterSignedOnly = false,
}: CreditPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'signed' | 'unsigned'>('all');

  const selectedCredit = credits.find((c) => c.id === selectedCreditId);

  const filteredCredits = credits.filter((c) => {
    const matchesSearch =
      c.origin.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toString().includes(search);
    if (!matchesSearch) return false;

    if (filterSignedOnly) return c.signed;
    if (tab === 'signed') return c.signed;
    if (tab === 'unsigned') return !c.signed;
    return true;
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          {selectedCredit ? (
            <View>
              <View style={styles.triggerRow}>
                <Text style={styles.triggerId}>Credit #{selectedCredit.id}</Text>
                <StatusBadge status={selectedCredit.signed ? 'signed' : 'unsigned'} size="sm" />
              </View>
              <Text style={styles.triggerOrigin} numberOfLines={1}>
                {selectedCredit.origin}
              </Text>
            </View>
          ) : (
            <Text style={styles.placeholder}>Select a Carbon Credit from Portfolio</Text>
          )}
        </View>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Carbon Credit</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by ID or registry..."
                value={search}
                onChangeText={setSearch}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Filter Tabs if not restricted to signed only */}
            {!filterSignedOnly && (
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tabItem, tab === 'all' && styles.tabItemActive]}
                  onPress={() => setTab('all')}
                >
                  <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>
                    All ({credits.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabItem, tab === 'signed' && styles.tabItemActive]}
                  onPress={() => setTab('signed')}
                >
                  <Text style={[styles.tabText, tab === 'signed' && styles.tabTextActive]}>
                    Signed ({credits.filter((c) => c.signed).length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabItem, tab === 'unsigned' && styles.tabItemActive]}
                  onPress={() => setTab('unsigned')}
                >
                  <Text style={[styles.tabText, tab === 'unsigned' && styles.tabTextActive]}>
                    Unsigned ({credits.filter((c) => !c.signed).length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Credits List */}
            <FlatList
              data={filteredCredits}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedCreditId;
                const canSelect = !filterSignedOnly || item.signed;

                return (
                  <TouchableOpacity
                    style={[
                      styles.creditItem,
                      isSelected && styles.creditItemSelected,
                      !canSelect && styles.creditItemDisabled,
                    ]}
                    disabled={!canSelect}
                    onPress={() => {
                      onSelectCredit(item);
                      setModalVisible(false);
                    }}
                  >
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemId}>Credit #{item.id}</Text>
                      <StatusBadge status={item.signed ? 'signed' : 'unsigned'} size="sm" />
                    </View>
                    <Text style={styles.itemOrigin}>{item.origin}</Text>
                    {item.signature ? (
                      <Text style={styles.itemSig} numberOfLines={1}>
                        HMAC: {item.signature.substring(0, 16)}...
                      </Text>
                    ) : (
                      <Text style={styles.itemNotice}>Pending Verifier Signature</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No credits match your filter</Text>
                </View>
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  triggerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  triggerContent: {
    flex: 1,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  triggerId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  triggerOrigin: {
    fontSize: 12,
    color: '#475569',
  },
  placeholder: {
    fontSize: 14,
    color: '#94a3b8',
  },
  chevron: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabItemActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#15803d',
  },
  listContainer: {
    padding: 16,
    gap: 10,
  },
  creditItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
  },
  creditItemSelected: {
    borderColor: '#15803d',
    backgroundColor: '#f0fdf4',
  },
  creditItemDisabled: {
    opacity: 0.5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemOrigin: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemSig: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  itemNotice: {
    fontSize: 11,
    color: '#d97706',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
