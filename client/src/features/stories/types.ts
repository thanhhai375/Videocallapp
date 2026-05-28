export interface Story {
  id: string;
  textContent?: string;
  mediaUrl?: string;
  mediaType: 'Text' | 'Image' | 'Video';
  backgroundColor?: string;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  isOwn: boolean;
  hasSeen: boolean;
}

export interface StoryGroup {
  user: { id: string; username: string; profilePictureUrl?: string };
  hasUnseen: boolean;
  stories: Story[];
}
