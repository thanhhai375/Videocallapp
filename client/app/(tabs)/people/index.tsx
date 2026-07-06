/**
 * =====================================================================
 *  PeopleScreen — "Bạn bè" UI Premium v3 (Search only)
 *  ─────────────────────────────────────────────────────────────────
 *  Tính năng:
 *   • Radar Panel (collapsible, friends orbiting, sweep line)
 *   • Search bạn bè trong danh sách (animated slide-down)
 *   • Online/Offline sections với staggered slide-in
 *   • Friend cards Glassmorphism với long-press để xóa
 *   • Modal thêm bạn: shake validation, shimmer, result fly-in
 *   • Dark Space theme (#0A0A0F)
 * =====================================================================
 */
import React, {
  useEffect, useState, useCallback, useRef, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl, Modal, Animated,
  Easing, Dimensions, Platform, Pressable, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { Avatar } from '@shared/components/Avatar';
import { ShimmerList } from '@shared/components/ShimmerCard';
import { useAuthStore } from '@features/auth/store/authStore';
import { useUserStore } from '@features/contacts/store/userStore';
import { API_URL } from '@shared/constants/config';

let styles: any;

// ─── Constants ─────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const RADAR_R = Math.min(SW * 0.42, 160);
const NEON    = '#0084FF';
const NEON2   = '#7B5CF0';
const ONLINE  = '#22C55E';

// ─── Types ─────────────────────────────────────────────────────────
type Tab = 'friends' | 'pending';

interface Friend {
  id: string; username: string; phoneNumber: string;
  profilePictureUrl?: string; isOnline: boolean;
  lastSeenAt?: string; connectionId?: string;
}
interface PendingRequest {
  id: string;
  sender: { id: string; username: string; profilePictureUrl?: string };
  message?: string; createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────
function isValidPhone(p: string) { return /^[0-9]{10,11}$/.test(p); }
function getInitial(n: string)   { return n ? n.charAt(0).toUpperCase() : '?'; }

const AVATAR_COLORS = ['#7B5CF0','#0084FF','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ═══════════════════════════════════════════════════════════════════
//  RADAR — Ripple + Sweep + Friends orbiting
// ═══════════════════════════════════════════════════════════════════
function RippleRing({ delay, radius, color }: { delay: number; radius: number; color: string }) {
  const scale   = useRef(new Animated.Value(0.1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,   duration: 2600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 2600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0.1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    a.start(); return () => a.stop();
  }, []);
  const sz = radius * 2;
  return (
    <Animated.View style={{
      position: 'absolute', width: sz, height: sz, borderRadius: radius,
      borderWidth: 1.5, borderColor: color, opacity, transform: [{ scale }],
    }} />
  );
}

function RadarFriendBubble({ friend, angle, ringRadius, delay }: {
  friend: Friend; angle: number; ringRadius: number; delay: number;
}) {
  const fadeA  = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(0.4)).current;
  const glowA  = useRef(new Animated.Value(0)).current;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * ringRadius;
  const y = Math.sin(rad) * ringRadius;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleA, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(fadeA,  { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
    if (friend.isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowA, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(glowA, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const glowOp = glowA.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });
  const color  = avatarColor(friend.username);

  return (
    <Animated.View style={{
      position: 'absolute',
      transform: [{ translateX: x - 22 }, { translateY: y - 22 }, { scale: scaleA }],
      opacity: fadeA, alignItems: 'center',
    }}>
      {friend.isOnline && (
        <Animated.View style={{
          position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
          borderRadius: 26, borderWidth: 2, borderColor: ONLINE, opacity: glowOp,
        }} />
      )}
      <TouchableOpacity
        style={[styles.radarBubble, { backgroundColor: color }]}
        onPress={() => router.push(`/chat/${friend.id}?name=${friend.username}&connectionId=${friend.connectionId || ''}` as any)}
      >
        <Text style={styles.radarBubbleText}>{getInitial(friend.username)}</Text>
      </TouchableOpacity>
      {friend.isOnline && <View style={styles.onlineDot} />}
      <View style={styles.radarNameTag}>
        <Text style={styles.radarNameText} numberOfLines={1}>{friend.username}</Text>
      </View>
    </Animated.View>
  );
}

function RadarPanel({ friends, userName }: { friends: Friend[]; userName: string }) {
  const sweepA    = useRef(new Animated.Value(0)).current;
  const contScale = useRef(new Animated.Value(0.9)).current;
  const contFade  = useRef(new Animated.Value(0)).current;
  const selfGlow  = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    let isMounted = true;
    const startAnim = () => {
      if (!isMounted) return;
      sweepA.setValue(0);
      anim = Animated.timing(sweepA, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      anim.start(({ finished }) => {
        if (finished && isMounted) {
          startAnim();
        }
      });
    };
    startAnim();

    Animated.parallel([
      Animated.spring(contScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(contFade,  { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(selfGlow, { toValue: 1,   duration: 1600, useNativeDriver: true }),
        Animated.timing(selfGlow, { toValue: 0.5, duration: 1600, useNativeDriver: true }),
      ])
    );
    glow.start();

    return () => {
      isMounted = false;
      if (anim) anim.stop();
      glow.stop();
    };
  }, []);

  const sweepRotate = sweepA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const selfShadow  = selfGlow.interpolate({ inputRange: [0.5, 1], outputRange: [0.4, 1] });

  const visibleFriends = friends.slice(0, 8);
  const innerFriends   = visibleFriends.filter(f => f.isOnline).slice(0, 4);
  const outerFriends   = visibleFriends.filter(f => !f.isOnline).slice(0, 4);
  const innerR  = RADAR_R * 0.52;
  const outerR  = RADAR_R * 0.88;
  const panelSz = RADAR_R * 2 + 80;

  return (
    <Animated.View style={[styles.radarPanel, { opacity: contFade, transform: [{ scale: contScale }] }]}>
      <View style={styles.radarLabelRow}>
        <View style={styles.radarLiveDot} />
        <Text style={styles.radarLabelText}>RADAR ACTIVE</Text>
      </View>

      <View style={{ width: panelSz, height: panelSz, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
        {[1, 0.7, 0.45].map((r, i) => (
          <View key={i} style={{
            position: 'absolute',
            width: RADAR_R * 2 * r, height: RADAR_R * 2 * r,
            borderRadius: RADAR_R * r, borderWidth: 1, borderColor: `${NEON}20`,
          }} />
        ))}
        <RippleRing delay={0}    radius={RADAR_R} color={`${NEON}80`} />
        <RippleRing delay={650}  radius={RADAR_R} color={`${NEON}60`} />
        <RippleRing delay={1300} radius={RADAR_R} color={`${NEON}40`} />

        <Animated.View style={[styles.sweepContainer, { transform: [{ rotate: sweepRotate }] }]}>
          <View style={[styles.sweepLine, { width: RADAR_R - 4 }]} />
          <View style={[styles.sweepTrail, { width: RADAR_R - 4 }]} />
        </Animated.View>
        <View style={[styles.crossH, { width: RADAR_R * 1.8 }]} />
        <View style={[styles.crossV, { height: RADAR_R * 1.8 }]} />

        {innerFriends.map((f, i) => (
          <RadarFriendBubble key={f.id} friend={f}
            angle={(i / Math.max(innerFriends.length, 1)) * 360 - 90}
            ringRadius={innerR} delay={i * 150 + 300} />
        ))}
        {outerFriends.map((f, i) => (
          <RadarFriendBubble key={f.id} friend={f}
            angle={(i / Math.max(outerFriends.length, 1)) * 360 - 45}
            ringRadius={outerR} delay={i * 150 + 600} />
        ))}

        <Animated.View style={[styles.selfGlow, { opacity: selfShadow }]} />
        <View style={styles.selfAvatar}>
          <Text style={styles.selfAvatarText}>{getInitial(userName)}</Text>
        </View>
        <View style={styles.selfPingDot} />
      </View>

      <View style={styles.radarLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ONLINE }]} />
          <Text style={styles.legendText}>Online ({innerFriends.length})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.textMuted }]} />
          <Text style={styles.legendText}>Offline ({outerFriends.length})</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SEARCH BAR — Animated slide-down từ header
// ═══════════════════════════════════════════════════════════════════
function SearchBar({ value, onChange, onClear, visible }: {
  value: string; onChange: (t: string) => void;
  onClear: () => void; visible: boolean;
}) {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacAnim   = useRef(new Animated.Value(0)).current;
  const inputRef   = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: visible ? 54 : 0,
        duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false,
      }),
      Animated.timing(opacAnim, {
        toValue: visible ? 1 : 0, duration: 240, useNativeDriver: false,
      }),
    ]).start();
    if (visible) setTimeout(() => inputRef.current?.focus(), 300);
  }, [visible]);

  return (
    <Animated.View style={{ height: heightAnim, opacity: opacAnim, overflow: 'hidden', paddingHorizontal: 16 }}>
      <View style={styles.searchBarInner}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={{ marginLeft: 12 }} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Tìm theo tên hoặc số điện thoại..."
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChange}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} style={{ padding: 8 }}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  FRIEND CARD — Glassmorphism, long-press to remove
// ═══════════════════════════════════════════════════════════════════
function FriendCard({ item, index, onChat, onLongPress, searchQuery }: {
  item: Friend; index: number;
  onChat: () => void; onLongPress: () => void;
  searchQuery?: string;
}) {
  const slideY     = useRef(new Animated.Value(30)).current;
  const fade       = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const color      = avatarColor(item.username);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 0, duration: 380, delay: index * 60,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1, duration: 380, delay: index * 60, useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePressIn  = () => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(pressScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  // Highlight search query trong tên
  const renderName = () => {
    if (!searchQuery?.trim()) return <Text style={styles.cardName}>{item.username}</Text>;
    const lower = item.username.toLowerCase();
    const idx   = lower.indexOf(searchQuery.toLowerCase().trim());
    if (idx === -1) return <Text style={styles.cardName}>{item.username}</Text>;
    return (
      <Text style={styles.cardName}>
        {item.username.slice(0, idx)}
        <Text style={styles.cardNameHighlight}>
          {item.username.slice(idx, idx + searchQuery.trim().length)}
        </Text>
        {item.username.slice(idx + searchQuery.trim().length)}
      </Text>
    );
  };

  return (
    <Animated.View style={{ transform: [{ translateY: slideY }, { scale: pressScale }], opacity: fade }}>
      <TouchableOpacity
        onPress={onChat} onLongPress={onLongPress}
        onPressIn={handlePressIn} onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.friendCard}>
          <View style={[styles.cardAccent, { backgroundColor: item.isOnline ? ONLINE : Colors.textMuted }]} />

          <View style={[styles.cardAvatar, { backgroundColor: color }]}>
            <Text style={styles.cardAvatarText}>{getInitial(item.username)}</Text>
            {item.isOnline && <View style={styles.cardOnlineBadge} />}
          </View>

          <View style={styles.cardInfo}>
            {renderName()}
            <View style={styles.cardStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: item.isOnline ? ONLINE : Colors.textMuted }]} />
              <Text style={[styles.cardStatus, { color: item.isOnline ? ONLINE : Colors.textMuted }]}>
                {item.isOnline ? 'Đang hoạt động' : item.phoneNumber}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.actionIcon, { backgroundColor: `${NEON}18` }]} onPress={onChat}>
            <Ionicons name="chatbubble-ellipses" size={17} color={NEON} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PENDING CARD
// ═══════════════════════════════════════════════════════════════════
function PendingCard({ item, index, onAccept, onReject }: {
  item: PendingRequest; index: number; onAccept: () => void; onReject: () => void;
}) {
  const slideY = useRef(new Animated.Value(30)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  const color  = avatarColor(item.sender.username);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 380, delay: index * 80, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fade,   { toValue: 1, duration: 380, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ transform: [{ translateY: slideY }], opacity: fade }}>
      <View style={styles.pendingCard}>
        <View style={[styles.cardAvatar, { backgroundColor: color }]}>
          <Text style={styles.cardAvatarText}>{getInitial(item.sender.username)}</Text>
        </View>
        <View style={[styles.cardInfo, { marginLeft: 10 }]}>
          <Text style={styles.cardName}>{item.sender.username}</Text>
          <Text style={[styles.cardStatus, { color: Colors.textSecondary }]}>
            {item.message || 'Muốn kết bạn với bạn'}
          </Text>
        </View>
        <View style={styles.pendingBtns}>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  EMPTY STATE — Floating animation
// ═══════════════════════════════════════════════════════════════════
function EmptyState({ isPending, onAdd, isSearch }: {
  isPending: boolean; onAdd?: () => void; isSearch?: boolean;
}) {
  const floatY = useRef(new Animated.Value(0)).current;
  const fade   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -12, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,   duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyWrap, { opacity: fade }]}>
      <Animated.View style={{ transform: [{ translateY: floatY }] }}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name={isSearch ? 'search-outline' : isPending ? 'mail-open-outline' : 'planet-outline'}
            size={52} color={NEON}
          />
        </View>
      </Animated.View>
      <Text style={styles.emptyTitle}>
        {isSearch ? 'Không tìm thấy' : isPending ? 'Không có lời mời' : 'Chưa có bạn bè'}
      </Text>
      <Text style={styles.emptySub}>
        {isSearch
          ? 'Thử tên khác hoặc số điện thoại'
          : isPending
          ? 'Lời mời kết bạn mới sẽ hiện ở đây'
          : 'Nhấn + để tìm kiếm bạn bè'}
      </Text>
      {!isPending && !isSearch && onAdd && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onAdd} activeOpacity={0.85}>
          <Ionicons name="person-add-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.emptyBtnText}>Thêm bạn bè</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ADD FRIEND MODAL
// ═══════════════════════════════════════════════════════════════════
function AddFriendModal({ visible, onClose, accessToken }: {
  visible: boolean; onClose: () => void; accessToken: string | null;
}) {
  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json',
  }), [accessToken]);

  const [phone,   setPhone]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ found: boolean; username?: string; message?: string } | null>(null);
  const [sending, setSending] = useState(false);

  const shakeX    = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(400)).current;
  const bgFade    = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 10,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 7,   duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -7,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 3,   duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
        Animated.timing(bgFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 260, useNativeDriver: true }),
        Animated.timing(bgFade, { toValue: 0, duration: 230, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleChange = (t: string) => {
    const d = t.replace(/[^0-9]/g, '').slice(0, 11);
    setPhone(d); setError(''); setResult(null);
  };

  const handleSearch = async () => {
    if (!isValidPhone(phone)) { setError('Nhập đúng 10-11 chữ số'); shake(); return; }
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${API_URL}/users/search?phone=${phone}`, { headers: authHeaders });
      if (res.ok) {
        const d = await res.json();
        setResult({ found: true, username: d.username });
      } else {
        setResult({ found: false, message: 'Số điện thoại chưa đăng ký tài khoản' });
      }
    } catch { setResult({ found: false, message: 'Không thể kết nối đến server' }); }
    finally   { setLoading(false); }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/friends/request`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const d = await res.json();
      if (res.ok) { Alert.alert('✅ Thành công', d.message); handleClose(); }
      else Alert.alert('Lỗi', d.message || 'Không gửi được lời mời');
    } catch { Alert.alert('Lỗi', 'Không thể kết nối đến server'); }
    finally   { setSending(false); }
  };

  const handleClose = () => { setPhone(''); setError(''); setResult(null); onClose(); };

  const resultSlide = useRef(new Animated.Value(20)).current;
  const resultFade  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (result) {
      resultSlide.setValue(20); resultFade.setValue(0);
      Animated.parallel([
        Animated.spring(resultSlide, { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.timing(resultFade,  { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [result]);

  const resColor = avatarColor(result?.username || 'U');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.modalBg, { opacity: bgFade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
      <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHdr}>
          <View>
            <Text style={styles.modalTitle}>Thêm bạn bè</Text>
            <Text style={styles.modalSub}>Tìm kiếm qua số điện thoại</Text>
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={handleClose}>
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.inputWrap, error ? styles.inputWrapErr : null, { transform: [{ translateX: shakeX }] }]}>
          <View style={styles.flagChip}>
            <Text style={{ fontSize: 16 }}>🇻🇳</Text>
            <Text style={styles.flagCode}>+84</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="Nhập số điện thoại..."
            placeholderTextColor={Colors.textMuted}
            value={phone} onChangeText={handleChange}
            keyboardType="number-pad" maxLength={11}
            returnKeyType="search" onSubmitEditing={handleSearch} autoFocus
          />
          <TouchableOpacity
            style={[styles.searchBtn, (!phone || loading) && { opacity: 0.5 }]}
            onPress={handleSearch} disabled={!phone || loading}
          >
            <Ionicons name={loading ? 'ellipsis-horizontal' : 'search'} size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {!!error && (
          <View style={styles.errorRow}>
            <Ionicons name="warning-outline" size={13} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.shimmerWrap}>
            <View style={styles.shimmerAvatar} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={[styles.shimmerBar, { width: '55%' }]} />
              <View style={[styles.shimmerBar, { width: '33%' }]} />
            </View>
          </View>
        )}

        {result && !loading && (
          <Animated.View style={{ transform: [{ translateY: resultSlide }], opacity: resultFade }}>
            <View style={[styles.resultCard, { borderColor: result.found ? `${NEON}50` : `${Colors.danger}50` }]}>
              {result.found ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.resultAva, { backgroundColor: resColor }]}>
                    <Text style={styles.resultAvaText}>{getInitial(result.username || '')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{result.username}</Text>
                    <Text style={styles.resultOk}>Tài khoản đã xác minh ✓</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.sendBtn, sending && { opacity: 0.55 }]}
                    onPress={handleSend} disabled={sending}
                  >
                    <Ionicons name="person-add" size={14} color="#fff" />
                    <Text style={styles.sendBtnText}>{sending ? '...' : 'Kết bạn'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.resultErrIcon}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </View>
                  <Text style={[styles.resultName, { color: Colors.danger, flex: 1, fontSize: 13 }]}>
                    {result.message}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {!result && !loading && (
          <Text style={styles.modalHint}>Ví dụ: 0901111111 (Nam) · 0902222222 (Hung)</Text>
        )}
      </Animated.View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function PeopleScreen() {
  const Colors = useTheme();
  styles = getStyles(Colors);
  const insets = useSafeAreaInsets();
  const { accessToken, userName } = useAuthStore();
  const [tab,        setTab]        = useState<Tab>('friends');
  const [friends,    setFriends]    = useState<Friend[]>([]);
  const [pending,    setPending]    = useState<PendingRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [showRadar,  setShowRadar]  = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ,    setSearchQ]    = useState('');

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json',
  }), [accessToken]);

  const fetchFriends = useCallback(async () => {
    if (!accessToken) return;
    try {
      const r = await fetch(`${API_URL}/friends`, { headers: authHeaders });
      if (r.ok) {
        const data = await r.json();
        setFriends(data);
      }
    } catch {}
  }, [accessToken]);

  const fetchPending = useCallback(async () => {
    if (!accessToken) return;
    try {
      const r = await fetch(`${API_URL}/friends/pending`, { headers: authHeaders });
      if (r.ok) setPending(await r.json());
    } catch {}
  }, [accessToken]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchPending()]);
    setLoading(false); setRefreshing(false);
  }, [fetchFriends, fetchPending]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Filter friends by search query
  const filteredFriends = useMemo(() => {
    if (!searchQ.trim()) return friends;
    const q = searchQ.toLowerCase().trim();
    return friends.filter(f =>
      f.username.toLowerCase().includes(q) || f.phoneNumber.includes(q)
    );
  }, [friends, searchQ]);

  const onlineFriends  = useMemo(() => filteredFriends.filter(f => f.isOnline),  [filteredFriends]);
  const offlineFriends = useMemo(() => filteredFriends.filter(f => !f.isOnline), [filteredFriends]);

  // Radar toggle
  const radarHeight = useRef(new Animated.Value(0)).current;
  const radarFade   = useRef(new Animated.Value(0)).current;
  const radarBtnRot = useRef(new Animated.Value(0)).current;

  const toggleRadar = () => {
    const next = !showRadar;
    setShowRadar(next);
    const h = RADAR_R * 2 + 160;
    Animated.parallel([
      Animated.timing(radarHeight, { toValue: next ? h : 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(radarFade,   { toValue: next ? 1 : 0, duration: 350, useNativeDriver: false }),
      Animated.timing(radarBtnRot, { toValue: next ? 1 : 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const radarBtnRotate = radarBtnRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  // Tab indicator
  const tabAnim = useRef(new Animated.Value(0)).current;
  const switchTab = (t: Tab) => {
    Animated.timing(tabAnim, {
      toValue: t === 'friends' ? 0 : 1, duration: 240,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    setTab(t); setSearchQ('');
  };
  const tabW       = (SW - 32) / 2;
  const indicatorX = tabAnim.interpolate({ inputRange: [0, 1], outputRange: [2, tabW + 2] });

  const handleAccept = async (id: string) => {
    try {
      const r = await fetch(`${API_URL}/friends/request/${id}/accept`, { method: 'PUT', headers: authHeaders });
      if (r.ok) { Alert.alert('✅', 'Đã chấp nhận!'); loadAll(); }
    } catch {}
  };
  const handleReject = async (id: string) => {
    try { await fetch(`${API_URL}/friends/request/${id}/reject`, { method: 'PUT', headers: authHeaders }); loadAll(); }
    catch {}
  };
  const handleRemove = (id: string, name: string) => {
    Alert.alert('Xóa bạn bè', `Xóa ${name} khỏi danh sách bạn bè?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        await fetch(`${API_URL}/friends/${id}`, { method: 'DELETE', headers: authHeaders });
        loadAll();
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View>
          <Text style={styles.headerTitle}>Bạn bè</Text>
          <Text style={styles.headerSub}>
            {friends.length > 0
              ? `${friends.filter(f => f.isOnline).length} đang hoạt động · ${friends.length} tổng`
              : 'Kết nối với mọi người'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* Search toggle */}
          <TouchableOpacity
            style={[styles.headerBtn, showSearch && styles.headerBtnSearch]}
            onPress={() => { setShowSearch(s => !s); if (showSearch) setSearchQ(''); }}
          >
            <Ionicons
              name={showSearch ? 'close' : 'search-outline'}
              size={19} color={showSearch ? NEON : Colors.textSecondary}
            />
          </TouchableOpacity>
          {/* Radar toggle */}
          <TouchableOpacity style={[styles.headerBtn, showRadar && styles.headerBtnRadar]} onPress={toggleRadar}>
            <Animated.View style={{ transform: [{ rotate: radarBtnRotate }] }}>
              <Ionicons name="radio-outline" size={20} color={showRadar ? '#fff' : Colors.textSecondary} />
            </Animated.View>
          </TouchableOpacity>
          {/* Add friend */}
          <TouchableOpacity style={[styles.headerBtn, styles.headerBtnPrimary]} onPress={() => setShowModal(true)}>
            <Ionicons name="person-add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SEARCH BAR ── */}
      <SearchBar
        value={searchQ}
        onChange={setSearchQ}
        onClear={() => setSearchQ('')}
        visible={showSearch && tab === 'friends'}
      />

      {/* ── TAB BAR ── */}
      <View style={styles.tabWrap}>
        <View style={styles.tabBar}>
          <Animated.View style={[styles.tabIndicator, { left: indicatorX, width: tabW - 4 }]} />
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('friends')}>
            <Text style={[styles.tabText, tab === 'friends' && styles.tabTextOn]}>
              Bạn bè{friends.length > 0 ? ` (${friends.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('pending')}>
            <Text style={[styles.tabText, tab === 'pending' && styles.tabTextOn]}>
              Lời mời{pending.length > 0 ? ` (${pending.length})` : ''}
            </Text>
            {pending.length > 0 && (
              <View style={styles.badge}><Text style={styles.badgeTxt}>{pending.length}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadAll(); }}
            tintColor={NEON}
          />
        }
      >
        {/* ── RADAR PANEL ── */}
        <Animated.View style={{ height: radarHeight, overflow: 'hidden', opacity: radarFade }}>
          {showRadar && <RadarPanel friends={friends} userName={userName || 'U'} />}
        </Animated.View>

        {/* ── CONTENT ── */}
        {loading ? (
          <ShimmerList />
        ) : tab === 'friends' ? (
          filteredFriends.length === 0 ? (
            <EmptyState
              isPending={false}
              isSearch={searchQ.trim().length > 0}
              onAdd={() => setShowModal(true)}
            />
          ) : (
            <View style={styles.listWrap}>
              {onlineFriends.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: ONLINE }]} />
                    <Text style={styles.sectionTitle}>Đang hoạt động — {onlineFriends.length}</Text>
                  </View>
                  {onlineFriends.map((item, i) => (
                    <FriendCard
                      key={item.id} item={item} index={i}
                      searchQuery={searchQ}
                      onChat={() => router.push(`/chat/${item.id}?name=${item.username}&connectionId=${item.connectionId || ''}` as any)}
                      onLongPress={() => handleRemove(item.id, item.username)}
                    />
                  ))}
                </>
              )}
              {offlineFriends.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: onlineFriends.length > 0 ? 14 : 0 }]}>
                    <View style={[styles.sectionDot, { backgroundColor: Colors.textMuted }]} />
                    <Text style={styles.sectionTitle}>Offline — {offlineFriends.length}</Text>
                  </View>
                  {offlineFriends.map((item, i) => (
                    <FriendCard
                      key={item.id} item={item} index={onlineFriends.length + i}
                      searchQuery={searchQ}
                      onChat={() => router.push(`/chat/${item.id}?name=${item.username}&connectionId=${item.connectionId || ''}` as any)}
                      onLongPress={() => handleRemove(item.id, item.username)}
                    />
                  ))}
                </>
              )}
            </View>
          )
        ) : (
          <View style={styles.listWrap}>
            {pending.length === 0 ? (
              <EmptyState isPending />
            ) : (
              pending.map((item, i) => (
                <PendingCard
                  key={item.id} item={item} index={i}
                  onAccept={() => handleAccept(item.id)}
                  onReject={() => handleReject(item.id)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <AddFriendModal visible={showModal} onClose={() => setShowModal(false)} accessToken={accessToken} />
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle:      { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  headerSub:        { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  headerActions:    { flexDirection: 'row', gap: 8 },
  headerBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.divider },
  headerBtnSearch:  { backgroundColor: `${NEON}20`, borderColor: NEON },
  headerBtnRadar:   { backgroundColor: `${NEON2}40`, borderColor: NEON2 },
  headerBtnPrimary: { backgroundColor: NEON, borderColor: NEON, shadowColor: NEON, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },

  // Search bar
  searchBarInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceInput, borderRadius: 12, borderWidth: 1, borderColor: `${NEON}40`, marginBottom: 8 },
  searchInput:    { flex: 1, paddingHorizontal: 10, paddingVertical: 12, color: Colors.text, fontSize: 14 },

  // Tabs
  tabWrap:      { paddingHorizontal: 16, marginBottom: 4 },
  tabBar:       { flexDirection: 'row', backgroundColor: Colors.surfaceInput, borderRadius: 14, height: 42, position: 'relative', borderWidth: 1, borderColor: Colors.divider },
  tabIndicator: { position: 'absolute', top: 2, bottom: 2, backgroundColor: NEON, borderRadius: 11 },
  tabBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, zIndex: 1 },
  tabText:      { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  tabTextOn:    { color: '#fff' },
  badge:        { backgroundColor: Colors.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeTxt:     { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Radar
  radarPanel:     { alignItems: 'center', paddingVertical: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider, marginHorizontal: 16, marginBottom: 8 },
  radarLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  radarLiveDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: ONLINE },
  radarLabelText: { fontSize: 10, color: ONLINE, fontWeight: '700', letterSpacing: 2 },
  sweepContainer: {
    position: 'absolute',
    width: RADAR_R * 2,
    height: RADAR_R * 2,
    left: '50%',
    top: '50%',
    marginLeft: -RADAR_R,
    marginTop: -RADAR_R,
  },
  sweepLine: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginTop: -1,
    height: 2,
    backgroundColor: `${NEON}CC`,
    borderRadius: 1,
  },
  sweepTrail: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginTop: -1,
    height: 2,
    opacity: 0.25,
    backgroundColor: NEON,
    borderRadius: 1,
  },
  crossH:         { position: 'absolute', height: 1, backgroundColor: `${NEON}15` },
  crossV:         { position: 'absolute', width: 1, backgroundColor: `${NEON}15` },
  selfGlow:       { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: NEON, opacity: 0.25 },
  selfAvatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: NEON, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: Colors.bg, zIndex: 10 },
  selfAvatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  selfPingDot:    { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: ONLINE, bottom: -30, right: -30, borderWidth: 2, borderColor: Colors.bg, zIndex: 11 },
  radarBubble:    { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  radarBubbleText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
  onlineDot:      { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: ONLINE, bottom: -1, right: -1, borderWidth: 1.5, borderColor: Colors.bg },
  radarNameTag:   { position: 'absolute', top: 42, alignSelf: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, minWidth: 40, alignItems: 'center' },
  radarNameText:  { color: Colors.text, fontSize: 9, fontWeight: '600', maxWidth: 60 },
  radarLegend:    { flexDirection: 'row', gap: 20, marginTop: 8 },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:      { width: 7, height: 7, borderRadius: 4 },
  legendText:     { color: Colors.textSecondary, fontSize: 11 },

  // List
  listWrap:      { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8, marginTop: 4 },
  sectionDot:    { width: 7, height: 7, borderRadius: 4 },
  sectionTitle:  { fontSize: 11, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },

  // Friend card
  friendCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: 16, marginBottom: 8, paddingVertical: 12, paddingRight: 12, borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  cardAccent:      { width: 3, height: '65%', borderRadius: 2, marginRight: 12 },
  cardAvatar:      { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cardAvatarText:  { color: '#fff', fontSize: 18, fontWeight: '700' },
  cardOnlineBadge: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: ONLINE, bottom: 0, right: 0, borderWidth: 2, borderColor: Colors.surfaceElevated },
  cardInfo:        { flex: 1, marginLeft: 10 },
  cardName:        { color: Colors.text, fontSize: 15, fontWeight: '700' },
  cardNameHighlight: { color: NEON, fontWeight: '800', backgroundColor: `${NEON}25` },
  cardStatusRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  statusDot:       { width: 6, height: 6, borderRadius: 3 },
  cardStatus:      { fontSize: 12 },
  actionIcon:      { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Pending card
  pendingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: 16, marginBottom: 8, padding: 12, borderWidth: 1, borderColor: Colors.divider },
  pendingBtns: { flexDirection: 'row', gap: 8 },
  acceptBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: ONLINE, justifyContent: 'center', alignItems: 'center' },
  rejectBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center' },

  // Empty state
  emptyWrap:  { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyIcon:  { width: 100, height: 100, borderRadius: 50, backgroundColor: `${NEON}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: `${NEON}30` },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
  emptyBtn:   { flexDirection: 'row', alignItems: 'center', marginTop: 24, backgroundColor: NEON, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modal
  modalBg:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay },
  modalSheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 28, paddingTop: 12, borderTopWidth: 1, borderColor: Colors.divider },
  modalHandle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted, alignSelf: 'center', marginBottom: 18 },
  modalHdr:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle:    { fontSize: 20, fontWeight: '800', color: Colors.text },
  modalSub:      { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surfaceInput, justifyContent: 'center', alignItems: 'center' },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceInput, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.divider, overflow: 'hidden', marginBottom: 8 },
  inputWrapErr:  { borderColor: Colors.danger },
  flagChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 13, borderRightWidth: 1, borderRightColor: Colors.divider },
  flagCode:      { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  phoneInput:    { flex: 1, paddingHorizontal: 12, paddingVertical: 13, color: Colors.text, fontSize: 16, fontWeight: '500' },
  searchBtn:     { backgroundColor: NEON, paddingHorizontal: 16, paddingVertical: 13, justifyContent: 'center', alignItems: 'center' },
  errorRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  errorText:     { color: Colors.danger, fontSize: 12 },
  shimmerWrap:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  shimmerAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.surfaceInput },
  shimmerBar:    { height: 12, borderRadius: 6, backgroundColor: Colors.surfaceInput },
  resultCard:    { backgroundColor: Colors.surfaceElevated, borderRadius: 16, borderWidth: 1.5, padding: 14, marginTop: 4 },
  resultAva:     { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  resultAvaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resultName:    { color: Colors.text, fontSize: 15, fontWeight: '700' },
  resultOk:      { color: ONLINE, fontSize: 11, marginTop: 2 },
  resultErrIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center' },
  sendBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: NEON, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  sendBtnText:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  modalHint:     { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
