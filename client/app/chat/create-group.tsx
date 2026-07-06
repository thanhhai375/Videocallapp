import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@shared/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@features/contacts/store/userStore';
import { useState } from 'react';
import { useSignalR } from '@shared/hooks/useSignalR';

export default function CreateGroupScreen() {
  const { userId, name } = useLocalSearchParams();
  const router = useRouter();
  const Colors = useTheme();
  const { users } = useUserStore();
  const { createGroup } = useSignalR(); // Need to add this to useSignalR

  // The initially selected user is the one we came from
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(userId ? [userId as string] : []));
  const [groupName, setGroupName] = useState('');

  // Filter out the current user (if they are in the list)
  const friends = users;

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedIds.size === 0) return;
    try {
      if (createGroup) {
         await createGroup(groupName.trim(), Array.from(selectedIds));
      }
      // Go back to chats list
      router.replace('/(tabs)/chats'); 
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity style={localStyles.userRow} onPress={() => toggleSelect(item.id)}>
        <View style={localStyles.avatar}>
          <Text style={localStyles.avatarInitial}>{item.name[0]?.toUpperCase()}</Text>
        </View>
        <Text style={[localStyles.userName, { color: Colors.text }]}>{item.name}</Text>
        <View style={[localStyles.checkbox, isSelected && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[localStyles.container, { backgroundColor: Colors.bg }]} edges={['top', 'bottom']}>
      <View style={localStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={localStyles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[localStyles.title, { color: Colors.text }]}>Nhóm mới</Text>
        <TouchableOpacity 
          onPress={handleCreate} 
          disabled={!groupName.trim() || selectedIds.size === 0}
          style={[localStyles.createBtn, (!groupName.trim() || selectedIds.size === 0) && { opacity: 0.5 }]}
        >
          <Text style={localStyles.createBtnText}>Tạo</Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.inputContainer}>
        <TextInput
          style={[localStyles.input, { color: Colors.text, borderBottomColor: Colors.primary }]}
          placeholder="Đặt tên nhóm..."
          placeholderTextColor="gray"
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      <Text style={[localStyles.sectionTitle, { color: Colors.text }]}>Gợi ý</Text>
      
      <FlatList
        data={friends}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}
      />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: '600' },
  createBtn: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { color: '#fff', fontWeight: 'bold' },
  inputContainer: { padding: 15 },
  input: { fontSize: 18, paddingVertical: 10, borderBottomWidth: 2 },
  sectionTitle: { paddingHorizontal: 15, paddingTop: 10, fontWeight: 'bold', fontSize: 14, opacity: 0.7 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'gray', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarInitial: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  userName: { flex: 1, fontSize: 16, fontWeight: '500' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'gray', alignItems: 'center', justifyContent: 'center' }
});
