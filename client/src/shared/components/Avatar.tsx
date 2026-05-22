import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';

interface AvatarProps {
  name: string;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ name, isOnline = false, size = 'md' }: AvatarProps) {
  const avatarSize = Layout.avatar[size];
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatar,
          { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
        ]}
      >
        <Text style={[styles.text, { fontSize: avatarSize * 0.4 }]}>{initial}</Text>
      </View>
      {isOnline && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: avatarSize * 0.3,
              height: avatarSize * 0.3,
              borderRadius: avatarSize * 0.15,
              borderWidth: size === 'sm' ? 1.5 : 2.5,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: Colors.surfaceInput,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    color: Colors.text,
    fontWeight: '600',
  },
  onlineBadge: {
    position: 'absolute',
    backgroundColor: Colors.online,
    borderColor: Colors.bg, // To create the cutout effect
  },
});
