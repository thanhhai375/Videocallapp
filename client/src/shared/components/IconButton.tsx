import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle, Text } from 'react-native';
import { useTheme } from '@shared/constants/colors';

interface IconButtonProps {
  icon: string; // Using string emoji as placeholder for actual icons (e.g. vector icons)
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number;
  backgroundColor?: string;
  color?: string;
}

export function IconButton({ 
  icon, 
  onPress, 
  style, 
  size = 40,
  backgroundColor,
  color,
}: IconButtonProps) {
  const Colors = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || Colors.surfaceInput,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: size * 0.45, color: color || Colors.text }}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
