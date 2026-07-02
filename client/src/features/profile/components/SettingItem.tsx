import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shared/constants/colors';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  isLast?: boolean;
}

export function SettingItem({ icon, title, subtitle, action, rightElement, danger, isLast }: Props) {
  const Colors = useTheme();
  const styles = getStyles(Colors);

  return (
    <TouchableOpacity 
      style={[styles.settingItem, isLast && { borderBottomWidth: 0 }]} 
      onPress={action} 
      disabled={!action}
    >
      <View style={[styles.settingIconBox, danger && { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}>
        <Ionicons name={icon} size={22} color={danger ? Colors.danger : Colors.text} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, danger && { color: Colors.danger }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : (action ? <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} /> : null)}
    </TouchableOpacity>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryDim, // use primaryDim instead of hardcoded white
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});
