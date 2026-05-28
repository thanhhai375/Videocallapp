export interface ProfileData {
  id: string;
  username: string;
  phoneNumber: string;
  email?: string;
  profilePictureUrl?: string;
  bio?: string;
  isOnline: boolean;
  createdAt: string;
}
