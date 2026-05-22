import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/layout';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function CallsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calls</Text>
      </View>
      
      <EmptyState 
        icon="📞"
        title="No recent calls"
        subtitle="Your recent voice and video calls will appear here."
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
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: 60,
    paddingBottom: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
});
