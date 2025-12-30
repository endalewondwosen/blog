export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  joinedAt: number;
  bookmarks: string[]; // Array of Post IDs
  bio?: string;
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: number;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverUrl: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: number; // Timestamp
  readTimeMinutes: number;
}

export interface ContentReview {
  critique: string;
  improvements: string[];
}

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
};