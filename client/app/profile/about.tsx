import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useTheme();
  const styles = getStyles(Colors);

  const [activeDoc, setActiveDoc] = useState<'terms' | 'privacy' | null>(null);

  const renderDocumentModal = () => {
    const isTerms = activeDoc === 'terms';
    const title = isTerms ? 'Điều khoản dịch vụ' : 'Chính sách bảo mật';
    const content = isTerms ? termsContent : privacyContent;

    return (
      <Modal
        visible={activeDoc !== null}
        animationType="slide"
        onRequestClose={() => setActiveDoc(null)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 10) }]}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setActiveDoc(null)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalText}>{content}</Text>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Về ứng dụng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Logo/Branding */}
        <View style={styles.brandBox}>
          <View style={styles.logoBox}>
            <Ionicons name="videocam" size={48} color="#FFF" />
          </View>
          <Text style={styles.appName}>VidCom</Text>
          <Text style={styles.version}>Phiên bản 1.0.0</Text>
          <Text style={styles.copyright}>© 2026 VidCom Inc.</Text>
        </View>

        {/* Links Section */}
        <View style={styles.linksContainer}>
          <TouchableOpacity style={styles.linkRow} onPress={() => setActiveDoc('terms')}>
            <View style={styles.linkLeft}>
              <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.linkText}>Điều khoản dịch vụ</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => setActiveDoc('privacy')}>
            <View style={styles.linkLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.linkText}>Chính sách bảo mật</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.linkRowNoAction}>
            <View style={styles.linkLeft}>
              <Ionicons name="git-branch-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.linkText}>Kiểu cài đặt</Text>
            </View>
            <Text style={styles.buildType}>Development</Text>
          </View>
        </View>
      </ScrollView>

      {renderDocumentModal()}
    </View>
  );
}

const termsContent = `ĐIỀU KHOẢN DỊCH VỤ

Chào mừng bạn đến với VidCom. Bằng việc sử dụng ứng dụng này, bạn đồng ý tuân thủ các điều khoản dịch vụ sau:

1. Chấp thuận điều khoản
Bằng cách tải xuống, cài đặt hoặc sử dụng VidCom, bạn đồng ý chịu sự ràng buộc bởi các Điều khoản này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, bạn phải ngừng sử dụng ứng dụng ngay lập tức.

2. Đăng ký tài khoản
Để sử dụng các tính năng gọi điện và nhắn tin, bạn cần tạo tài khoản thông qua số điện thoại cá nhân. Bạn chịu trách nhiệm bảo mật tài khoản của mình và chịu mọi trách nhiệm về tất cả các hoạt động xảy ra dưới tài khoản của bạn.

3. Hành vi người dùng
Bạn đồng ý sử dụng VidCom chỉ cho các mục đích hợp pháp. Nghiêm cấm:
- Sử dụng ứng dụng để quấy rối, đe dọa, lừa đảo, hoặc xúc phạm người khác.
- Gửi tin nhắn spam, quảng cáo không mong muốn, tin nhắn chứa phần mềm độc hại.
- Mạo danh cá nhân hoặc tổ chức khác.
- Chụp ảnh, ghi âm cuộc gọi của người khác mà không có sự đồng ý của họ.

4. Quyền sở hữu trí tuệ
Tất cả mã nguồn, giao diện, thiết kế và logo của VidCom đều thuộc quyền sở hữu trí tuệ của chúng tôi hoặc các đối tác cấp phép. Bạn không được sao chép, chỉnh sửa hoặc dịch ngược mã nguồn ứng dụng.

5. Chấm dứt dịch vụ
Chúng tôi có quyền chấm dứt hoặc đình chỉ tài khoản của bạn ngay lập tức, không cần thông báo trước, nếu bạn vi phạm bất kỳ điều khoản nào.

Nếu có bất kỳ câu hỏi nào về Điều khoản dịch vụ này, vui lòng liên hệ với chúng tôi thông qua mục Báo cáo sự cố.`;

const privacyContent = `CHÍNH SÁCH BẢO MẬT

Quyền riêng tư của bạn là ưu tiên hàng đầu của chúng tôi. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn:

1. Thông tin chúng tôi thu thập
- Số điện thoại: Dùng để xác thực tài khoản và kết nối bạn bè.
- Tên hiển thị (Username): Giúp nhận diện danh tính trong danh sách chat và cuộc gọi.
- Phương tiện (Ảnh đại diện, Hình ảnh gửi đi): Lưu trữ tạm thời trên máy chủ để truyền tải cuộc trò chuyện.
- Trạng thái trực tuyến và camera/mic: Chỉ truy cập khi được sự cho phép để thực hiện tính năng gọi điện video.

2. Cách dữ liệu được sử dụng
Chúng tôi sử dụng thông tin thu thập được để:
- Thiết lập kết nối gọi điện, truyền phát video trực tiếp.
- Gửi nhận tin nhắn thời gian thực giữa các tài khoản.
- Quản lý danh sách bạn bè, danh sách chặn và danh bạ của bạn.
- Cải thiện chất lượng dịch vụ gọi điện và khắc phục sự cố.

3. Bảo mật cuộc gọi & tin nhắn
Các cuộc gọi video/audio được thiết lập trực tiếp giữa các thiết bị (P2P - Peer to Peer) thông qua giao thức WebRTC bảo mật, giảm thiểu tối đa việc dữ liệu cuộc gọi truyền qua máy chủ trung gian. Tin nhắn được lưu trữ trong cơ sở dữ liệu được bảo vệ nghiêm ngặt.

4. Chia sẻ thông tin
Chúng tôi cam kết không bán, trao đổi hoặc chuyển giao thông tin cá nhân của bạn cho bên thứ ba ngoại trừ trường hợp có yêu cầu pháp lý từ cơ quan chức năng có thẩm quyền.

5. Quyền của bạn
Bạn có quyền sửa đổi thông tin cá nhân tại mục Cài đặt tài khoản hoặc xóa bỏ tài khoản của mình bất kỳ lúc nào.

Bằng cách sử dụng VidCom, bạn đồng ý với Chính sách bảo mật này.`;

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Layout.spacing.md,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
      backgroundColor: Colors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text,
    },
    scrollContent: {
      padding: 16,
      alignItems: 'center',
    },
    brandBox: {
      alignItems: 'center',
      marginTop: 32,
      marginBottom: 32,
    },
    logoBox: {
      width: 90,
      height: 90,
      borderRadius: 24,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    appName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: 4,
    },
    version: {
      fontSize: 15,
      color: Colors.textSecondary,
      marginBottom: 4,
    },
    copyright: {
      fontSize: 12,
      color: Colors.textMuted,
    },
    linksContainer: {
      width: '100%',
      backgroundColor: Colors.surfaceElevated,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.divider,
    },
    linkRowNoAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: Colors.surfaceElevated,
    },
    linkLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    linkText: {
      fontSize: 16,
      color: Colors.text,
      fontWeight: '500',
    },
    buildType: {
      fontSize: 14,
      color: Colors.textSecondary,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
      backgroundColor: Colors.surface,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text,
    },
    closeButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    modalScroll: {
      padding: 20,
    },
    modalText: {
      fontSize: 15,
      lineHeight: 24,
      color: Colors.text,
    },
  });
