import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { useUserStore } from '@features/contacts/store/userStore';
import { Avatar } from '@shared/components/Avatar';
import { IconButton } from '@shared/components/IconButton';

export default function PeopleScreen() {
  const { users } = useUserStore();
  const activeFriends = users.filter((u) => u.isOnline);

  const renderItem = ({ item }: { item: typeof users[0] }) => (
    <TouchableOpacity 
      style={styles.personItem}
      onPress={() => router.push(`/(tabs)/chats/${item.id}?name=${item.name}&connectionId=${item.connectionId || ''}`)}
    >
      <Avatar name={item.name} isOnline={item.isOnline} size="md" />
      <Text style={styles.personName}>{item.name}</Text>
      <View style={styles.waveBtn}>
        <Text style={styles.waveIcon}>👋</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>People</Text>
        <IconButton icon="👥" onPress={() => {}} backgroundColor="transparent" size={32} />
      </View>

      <View style={styles.activeHeader}>
        <Text style={styles.activeTitle}>Active Now ({activeFriends.length})</Text>
      </View>

      <FlatList
        data={activeFriends}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No one is active right now.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: 60,
    paddingBottom: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  activeHeader: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.sm,
  },
  activeTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  listContent: {
    paddingHorizontal: Layout.spacing.lg,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
  },
  personName: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '500',
    marginLeft: Layout.spacing.md,
    flex: 1,
  },
  waveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceInput,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveIcon: {
    fontSize: 18,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
