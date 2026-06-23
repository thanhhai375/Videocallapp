/**
 * ShimmerCard — Skeleton Loading với hiệu ứng shimmer quét qua
 * Sử dụng React Native Animated API (useNativeDriver: true → 60fps)
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ShimmerCardProps {
  style?: object;
}

export function ShimmerCard({ style }: ShimmerCardProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Shimmer translateX từ -200 đến +200
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 220],
  });

  return (
    <View style={[styles.card, style]}>
      {/* Avatar skeleton */}
      <View style={styles.avatarSkeleton}>
        <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
      </View>
      <View style={styles.info}>
        {/* Name skeleton */}
        <View style={styles.nameSkeleton}>
          <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
        </View>
        {/* Sub skeleton */}
        <View style={styles.subSkeleton}>
          <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
        </View>
      </View>
      {/* Action button skeleton */}
      <View style={styles.btnSkeleton}>
        <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
      </View>
    </View>
  );
}

/** Hiển thị 3 ShimmerCard xếp chồng */
export function ShimmerList() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      {[0, 1, 2].map((i) => (
        <ShimmerCard key={i} style={{ marginBottom: 4 }} />
      ))}
    </View>
  );
}

const SKELETON_BG = '#2A2B2C';
const SHIMMER_COLOR = 'rgba(255,255,255,0.08)';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SKELETON_BG,
    overflow: 'hidden',
  },
  info: { flex: 1, gap: 8 },
  nameSkeleton: {
    height: 14,
    borderRadius: 7,
    backgroundColor: SKELETON_BG,
    width: '65%',
    overflow: 'hidden',
  },
  subSkeleton: {
    height: 11,
    borderRadius: 5,
    backgroundColor: SKELETON_BG,
    width: '40%',
    overflow: 'hidden',
  },
  btnSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SKELETON_BG,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SHIMMER_COLOR,
    // Gradient effect bằng cách dùng width rộng hơn
    width: 80,
  },
});
