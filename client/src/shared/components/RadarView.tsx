/**
 * RadarView — Hiệu ứng Radar Pulse Ripple sóng âm quét bạn bè
 * Dùng React Native Animated API (UI Thread safe, 60fps)
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const RADAR_SIZE = Math.min(SCREEN_W * 0.9, 340);
const NUM_RIPPLES = 4;

interface RadarViewProps {
  /** Nội dung trung tâm (Avatar người dùng) */
  children: React.ReactNode;
  /** Màu sóng ripple */
  rippleColor?: string;
}

/**
 * Một vòng ripple đơn lẻ — mỗi vòng có delay khác nhau
 */
function RippleRing({ delay, color }: { delay: number; color: string }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

export function RadarView({ children, rippleColor = '#0084FF' }: RadarViewProps) {
  return (
    <View style={styles.container}>
      {/* Vòng tròn nền radar */}
      <View style={[styles.radarBg, { borderColor: `${rippleColor}18` }]} />
      <View style={[styles.radarBg, styles.radarMid, { borderColor: `${rippleColor}10` }]} />

      {/* Các vòng ripple pulse */}
      {Array.from({ length: NUM_RIPPLES }).map((_, i) => (
        <RippleRing key={i} delay={i * 600} color={rippleColor} />
      ))}

      {/* Avatar trung tâm */}
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  radarBg: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 1,
  },
  radarMid: {
    width: RADAR_SIZE * 0.6,
    height: RADAR_SIZE * 0.6,
    borderRadius: (RADAR_SIZE * 0.6) / 2,
  },
  ripple: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 1.5,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
