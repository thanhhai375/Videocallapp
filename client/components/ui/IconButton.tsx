import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle, Text } from 'react-native';
import { Colors } from '../../constants/colors';

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
  backgroundColor = Colors.surfaceInput,
  color = Colors.text,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: size * 0.45, color }}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
