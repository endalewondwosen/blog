import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Loader2, Search } from 'lucide-react';
import { BlogPost } from '../types';
import { api } from '../services/api';
import PostCard from '../components/PostCard';

const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
        try {
            const data = await api.getPosts();
            setPosts(data);
        } catch (error) {
            console.error("Failed to fetch posts", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return posts.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        post.content.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100 pb-12 pt-12 lg:pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6">
            <Sparkles size={16} />
            <span>AI-Powered MERN Blog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Stories that <span className="text-indigo-600">inspire</span> ideas.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Discover thoughts, tutorials, and insights from our community. 
            Built with MongoDB, Express, React, Node.js and Gemini.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                <Search size={20} />
            </div>
            <input 
                type="text" 
                placeholder="Search articles by title, tag, or content..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-2xl border border-gray-200 shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-lg outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
                {searchQuery ? `Results for "${searchQuery}"` : 'Latest Articles'}
            </h2>
            {!isLoading && <div className="hidden sm:block text-sm text-gray-500">Showing {filteredPosts.length} posts</div>}
        </div>
        
        {isLoading ? (
            <div className="flex justify-center py-20">
                <Loader2 size={40} className="text-indigo-600 animate-spin" />
            </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <h3 className="text-xl font-medium text-gray-900">No posts found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;