import { BlogPost, User, Comment, ContentReview } from '../types';
import { 
  generateBlogContent, 
  generateBlogSummary, 
  generateSmartTags, 
  generateTitleSuggestions, 
  generateContentReview,
  generateCoverImage,
  generateAudio,
  generatePostQA,
  translatePost
} from './geminiService';

// --- MOCK DATABASE (For Preview Environment) ---
const STORAGE_KEYS = {
  POSTS: 'myblog_posts',
  CURRENT_USER: 'myblog_current_user',
  USERS: 'myblog_users' // Stores { username, password, ...User }
};

const INITIAL_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of AI in Web Development',
    content: "Artificial Intelligence is rapidly transforming how we build and interact with the web. From intelligent code completion tools like GitHub Copilot to sophisticated generative models that can draft entire layouts, the landscape is shifting. \n\n### The Shift to Intent-Based Coding\n\nDevelopers are no longer just writers of syntax; they are becoming **architects of intent**. We can now describe what we want, and AI helps bridge the gap to implementation. However, this doesn't replace the need for deep understanding. It elevates it. We must understand the principles of design, accessibility, and performance even more deeply to guide these powerful tools effectively.\n\n> \"Creativity and problem-solving skills are more valuable than rote memorization of API methods.\"\n\nThe future is bright, collaborative, and incredibly fast-paced.",
    excerpt: 'Artificial Intelligence is rapidly transforming how we build and interact with the web...',
    coverUrl: 'https://picsum.photos/800/400?random=1',
    tags: ['AI', 'Web Development', 'Future'],
    likes: 42,
    comments: [
        {
            id: 'c1',
            text: "This is a great perspective! I completely agree about the 'architects of intent' concept.",
            authorId: 'reader1',
            authorName: 'Sarah Jenkins',
            authorAvatar: 'https://picsum.photos/100/100?random=201',
            createdAt: Date.now() - 86400000
        }
    ],
    authorId: 'demo-user',
    authorName: 'Demo User',
    authorAvatar: 'https://picsum.photos/100/100?random=100',
    createdAt: Date.now() - 100000000,
    readTimeMinutes: 3,
  },
  {
    id: '2',
    title: 'Minimalism in UI Design',
    content: "Minimalism isn't just about using less; it's about making space for what matters. By stripping away the non-essential, we allow the user's focus to land squarely on the content and functionality that drives the application.\n\n### The Power of White Space\n\nWhite space is not empty space—it is an **active design element**. It provides breathing room, reduces cognitive load, and creates a sense of elegance and sophistication.\n\n- Reduces cognitive load\n- Improves readability\n- Creates hierarchy\n\nWhen we design with restraint, every element that remains must earn its place.",
    excerpt: "Minimalism isn't just about using less; it's about making space for what matters...",
    coverUrl: 'https://picsum.photos/800/400?random=2',
    tags: ['Design', 'UI/UX', 'Minimalism'],
    likes: 128,
    comments: [],
    authorId: 'alice-doe',
    authorName: 'Alice Doe',
    authorAvatar: 'https://picsum.photos/100/100?random=101',
    createdAt: Date.now() - 50000000,
    readTimeMinutes: 2,
  }
];

const INITIAL_USERS = [
  {
    id: 'demo-user',
    username: 'demo-user',
    password: 'password',
    avatarUrl: 'https://picsum.photos/100/100?random=100',
    joinedAt: Date.now() - 100000000,
    bookmarks: ['2'],
    bio: "Tech enthusiast, avid writer, and coffee lover. I explore the intersection of technology and creativity.",
    role: 'user' as const
  },
  {
    id: 'alice-doe',
    username: 'alice-doe',
    password: 'password',
    avatarUrl: 'https://picsum.photos/100/100?random=101',
    joinedAt: Date.now() - 50000000,
    bookmarks: [],
    bio: "UI/UX Designer with a passion for minimalism and accessible design patterns.",
    role: 'user' as const
  }
];

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API INTERFACE ---

class ApiClient {
  private useMock: boolean;
  private baseUrl: string;

  constructor(useMock = true) {
    this.useMock = useMock;
    this.baseUrl = 'http://localhost:5000/api';
  }

  // --- AUTHENTICATION ---

  async getCurrentUser(): Promise<User | null> {
    if (this.useMock) {
      await delay(300);
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    }
    // Real implementation would hit a /me endpoint and verify JWT
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        const res = await fetch(`${this.baseUrl}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
  }

  async getUserProfile(id: string): Promise<User | undefined> {
    if (this.useMock) {
        await delay(300);
        let usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
        let users = usersStr ? JSON.parse(usersStr) : INITIAL_USERS;
        const user = users.find((u: any) => u.id === id);
        
        if (user) {
             const { password: _, ...safeUser } = user;
             // Ensure bio is present for demo consistency if missing in storage
             if (!safeUser.bio) {
                 const initial = INITIAL_USERS.find(u => u.id === id);
                 if (initial) safeUser.bio = initial.bio;
             }
             return safeUser;
        }
        
        // Fallback for demo
        const initial = INITIAL_USERS.find(u => u.id === id);
        if (initial) {
            const { password: _, ...safeUser } = initial;
            return safeUser;
        }

        return undefined;
    }

    try {
        const res = await fetch(`${this.baseUrl}/users/${id}`);
        if (!res.ok) return undefined;
        return res.json();
    } catch {
        return undefined;
    }
  }

  async login(username: string, password: string): Promise<User> {
    if (this.useMock) {
      await delay(800);
      
      let usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
      let users = usersStr ? JSON.parse(usersStr) : [];

      // SEEDING: If no users exist, seed the defaults so "demo-user" works immediately
      if (users.length === 0) {
        users = INITIAL_USERS;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      
      const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      
      if (!user) {
          throw new Error("Invalid credentials");
      }

      // Return user without password
      const { password: _, ...safeUser } = user;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
      return safeUser;
    }
    
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Login failed');
    }
    
    const data = await res.json();
    localStorage.setItem('token', data.token);
    return data.user;
  }

  async register(username: string, password: string): Promise<User> {
    if (this.useMock) {
        await delay(800);
        
        let usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
        let users = usersStr ? JSON.parse(usersStr) : [];
        
        // Seed if empty (consistency)
        if (users.length === 0) {
            users = INITIAL_USERS;
        }
        
        if (users.find((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
            throw new Error("Username already taken");
        }

        const newUser = {
            id: `user-${Date.now()}`,
            username,
            password, // In real app, never store plain text
            avatarUrl: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 1000)}`,
            joinedAt: Date.now(),
            bookmarks: [],
            bio: "I'm a new writer here!",
            role: 'user' as const
        };

        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        const { password: _, ...safeUser } = newUser;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
        return safeUser;
    }

    const res = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
    }
    
    const data = await res.json();
    localStorage.setItem('token', data.token);
    return data.user;
  }

  async logout(): Promise<void> {
    if (this.useMock) {
      await delay(200);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      return;
    }
    localStorage.removeItem('token');
  }

  async toggleBookmark(postId: string): Promise<string[]> {
    if (this.useMock) {
        await delay(300);
        const currentUserStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (!currentUserStr) throw new Error("Not authenticated");
        
        const user = JSON.parse(currentUserStr);
        const bookmarks = user.bookmarks || [];
        
        let newBookmarks;
        if (bookmarks.includes(postId)) {
            newBookmarks = bookmarks.filter((id: string) => id !== postId);
        } else {
            newBookmarks = [...bookmarks, postId];
        }
        
        user.bookmarks = newBookmarks;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        
        // Also update the main users list to persist across logins
        const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
        if (usersStr) {
            const users = JSON.parse(usersStr);
            const index = users.findIndex((u: any) => u.id === user.id);
            if (index !== -1) {
                users[index].bookmarks = newBookmarks;
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            }
        }
        
        return newBookmarks;
    }

    const token = localStorage.getItem('token');
    const res = await fetch(`${this.baseUrl}/users/bookmark/${postId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data.bookmarks;
  }

  // --- POSTS ---

  async getPosts(): Promise<BlogPost[]> {
    if (this.useMock) {
      await delay(600); 
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_POSTS));
        return INITIAL_POSTS;
      }
      return JSON.parse(stored);
    }

    const res = await fetch(`${this.baseUrl}/posts`);
    return res.json();
  }

  async getPostsByUser(userId: string): Promise<BlogPost[]> {
    if (this.useMock) {
        await delay(400);
        const posts = await this.getPosts();
        return posts.filter(p => p.authorId === userId);
    }
    const res = await fetch(`${this.baseUrl}/posts?author=${userId}`);
    return res.json();
  }

  async getBookmarkedPosts(bookmarkIds: string[]): Promise<BlogPost[]> {
    if (this.useMock) {
        await delay(400);
        const posts = await this.getPosts();
        return posts.filter(p => bookmarkIds.includes(p.id));
    }
    const res = await fetch(`${this.baseUrl}/posts?ids=${bookmarkIds.join(',')}`);
    return res.json();
  }

  async getPostById(id: string): Promise<BlogPost | undefined> {
    if (this.useMock) {
      await delay(300);
      const posts = await this.getPosts();
      return posts.find((p) => p.id === id);
    }

    const res = await fetch(`${this.baseUrl}/posts/${id}`);
    if (!res.ok) return undefined;
    return res.json();
  }

  async createPost(post: Partial<BlogPost>): Promise<BlogPost> {
    if (this.useMock) {
      await delay(800);
      const posts = await this.getPosts();
      const newPost = { 
        ...post, 
        id: `post-${Date.now()}`, 
        createdAt: Date.now(),
        tags: post.tags || [],
        likes: 0,
        comments: []
      } as BlogPost;
      posts.unshift(newPost);
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      return newPost;
    }

    const token = localStorage.getItem('token');
    const res = await fetch(`${this.baseUrl}/posts`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(post)
    });
    return res.json();
  }

  async updatePost(id: string, post: Partial<BlogPost>): Promise<BlogPost> {
    if (this.useMock) {
      await delay(800);
      const posts = await this.getPosts();
      const index = posts.findIndex(p => p.id === id);
      if (index !== -1) {
        posts[index] = { ...posts[index], ...post };
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
        return posts[index];
      }
      throw new Error('Post not found');
    }

    const token = localStorage.getItem('token');
    const res = await fetch(`${this.baseUrl}/posts/${id}`, {
      method: 'PUT',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(post)
    });
    return res.json();
  }

  async deletePost(id: string): Promise<void> {
    if (this.useMock) {
      await delay(300); // Reduced delay for better UX
      // Access storage directly to avoid chaining delays
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      const posts = stored ? JSON.parse(stored) : INITIAL_POSTS;
      const filtered = posts.filter((p: BlogPost) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(filtered));
      return;
    }

    const token = localStorage.getItem('token');
    await fetch(`${this.baseUrl}/posts/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  // --- INTERACTIONS ---

  async toggleLike(id: string): Promise<number> {
    if (this.useMock) {
        await delay(200);
        const posts = await this.getPosts();
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {
            posts[index].likes = (posts[index].likes || 0) + 1;
            localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
            return posts[index].likes;
        }
        return 0;
    }
    const res = await fetch(`${this.baseUrl}/posts/${id}/like`, { method: 'POST' });
    const data = await res.json();
    return data.likes;
  }

  async addComment(postId: string, comment: Partial<Comment>): Promise<Comment> {
    if (this.useMock) {
        await delay(500);
        const posts = await this.getPosts();
        const index = posts.findIndex(p => p.id === postId);
        if (index !== -1) {
            const newComment = {
                ...comment,
                id: `c-${Date.now()}`,
                createdAt: Date.now()
            } as Comment;
            
            const existingComments = posts[index].comments || [];
            posts[index].comments = [newComment, ...existingComments];
            localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
            return newComment;
        }
        throw new Error('Post not found');
    }
    
    const token = localStorage.getItem('token');
    const res = await fetch(`${this.baseUrl}/posts/${postId}/comments`, { 
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(comment)
    });
    return res.json();
  }

  // --- AI SERVICES ---

  async generateContent(topic: string): Promise<string> {
    if (this.useMock) {
        return generateBlogContent(topic);
    }
    const res = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, type: 'content' })
    });
    const data = await res.json();
    return data.text;
  }

  async generateSummary(content: string): Promise<string> {
    if (this.useMock) {
        return generateBlogSummary(content);
    }
    const res = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: content, type: 'summary' })
    });
    const data = await res.json();
    return data.text;
  }

  async generateSmartTags(content: string): Promise<string[]> {
    if (this.useMock) {
        return generateSmartTags(content);
    }
    const res = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: content, type: 'tags' })
    });
    const data = await res.json();
    return data.result;
  }

  async generateTitleSuggestions(title: string, content: string): Promise<string[]> {
    if (this.useMock) {
        return generateTitleSuggestions(title, content);
    }
    const res = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: content, title, type: 'titles' })
    });
    const data = await res.json();
    return data.result;
  }

  async generateContentReview(content: string): Promise<ContentReview> {
    if (this.useMock) {
        return generateContentReview(content);
    }
    const res = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: content, type: 'review' })
    });
    const data = await res.json();
    return data.result;
  }

  async generateCoverImage(prompt: string): Promise<string | null> {
    if (this.useMock) {
        return generateCoverImage(prompt);
    }
    const res = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: prompt, type: 'image' })
    });
    const data = await res.json();
    return data.image; 
  }

  async generateAudio(text: string): Promise<string | null> {
    if (this.useMock) {
        return generateAudio(text);
    }
    const res = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: text, type: 'audio' })
    });
    const data = await res.json();
    return data.audio;
  }

  async askPostQuestion(content: string, question: string): Promise<string> {
    if (this.useMock) {
        return generatePostQA(content, question);
    }
    const res = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: question, context: content, type: 'qa' })
    });
    const data = await res.json();
    return data.text;
  }

  async translatePost(title: string, content: string, language: string): Promise<{ title: string, content: string }> {
    if (this.useMock) {
        return translatePost(title, content, language);
    }
    const res = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic: content, type: 'translate', targetLanguage: language })
    });
    const data = await res.json();
    return data.result;
  }
}

// Export a singleton instance
// NOTE: Set true for Preview environment (Mock Mode), set false for Real MERN Backend
export const api = new ApiClient(true);