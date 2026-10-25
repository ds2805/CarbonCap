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
import { User } from '@/services/api';

interface UserPickerProps {
  users: User[];
  selectedUserId: number | null;
  onSelectUser: (user: User) => void;
  excludeUserId?: number | null;
  filterRole?: string;
  label?: string;
}

export function UserPicker({
  users,
  selectedUserId,
  onSelectUser,
  excludeUserId,
  filterRole = 'Trader',
  label = 'Select Recipient (Buyer)',
}: UserPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const eligibleUsers = users.filter((u) => {
    if (excludeUserId && u.id === excludeUserId) return false;
    if (filterRole && u.role !== filterRole) return false;
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          {selectedUser ? (
            <View style={styles.selectedRow}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>
                  {selectedUser.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.selectedUsername}>{selectedUser.username}</Text>
                <Text style={styles.selectedRole}>{selectedUser.role} · #{selectedUser.id}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholder}>{label}</Text>
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
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username..."
                value={search}
                onChangeText={setSearch}
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={eligibleUsers}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedUserId;

                return (
                  <TouchableOpacity
                    style={[styles.userItem, isSelected && styles.userItemSelected]}
                    onPress={() => {
                      onSelectUser(item);
                      setModalVisible(false);
                    }}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>{item.username}</Text>
                      <Text style={styles.userRole}>
                        ID #{item.id} · {item.role}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.roleBadge,
                        item.role === 'Trader'
                          ? styles.badgeTrader
                          : item.role === 'Verifier'
                          ? styles.badgeVerifier
                          : styles.badgeAdmin,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          item.role === 'Trader'
                            ? styles.badgeTextTrader
                            : item.role === 'Verifier'
                            ? styles.badgeTextVerifier
                            : styles.badgeTextAdmin,
                        ]}
                      >
                        {item.role}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found</Text>
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
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  selectedRole: {
    fontSize: 11,
    color: '#64748b',
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
    maxHeight: '80%',
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
  listContainer: {
    padding: 16,
    gap: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  userItemSelected: {
    borderColor: '#15803d',
    backgroundColor: '#f0fdf4',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  userRole: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  roleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeTrader: {
    backgroundColor: '#dcfce7',
  },
  badgeVerifier: {
    backgroundColor: '#e0f2fe',
  },
  badgeAdmin: {
    backgroundColor: '#f3e8ff',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextTrader: {
    color: '#15803d',
  },
  badgeTextVerifier: {
    color: '#0369a1',
  },
  badgeTextAdmin: {
    color: '#7e22ce',
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
