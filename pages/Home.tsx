import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Search, TrendingUp, Mail, ArrowRight, Clock, Calendar } from 'lucide-react';
import { BlogPost } from '../types';
import { api } from '../services/api';
import PostCard from '../components/PostCard';
import SEO from '../components/SEO';

const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const navigate = useNavigate();

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

  // Extract popular tags
  const popularTags = useMemo(() => {
      const tagCounts: Record<string, number> = {};
      posts.forEach(post => {
          post.tags?.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
      });
      return Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([tag]) => tag);
  }, [posts]);

  const handleSubscribe = (e: React.FormEvent) => {
      e.preventDefault();
      if(email) {
          setSubscribed(true);
          setEmail('');
          setTimeout(() => setSubscribed(false), 3000);
      }
  };

  // Determine layout content
  const featuredPost = !searchQuery && posts.length > 0 ? posts[0] : null;
  const gridPosts = !searchQuery && posts.length > 0 ? posts.slice(1) : filteredPosts;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <SEO 
        title="MyBlog - Stories that Inspire" 
        description="Discover insightful articles about AI, Design, and Development on MyBlog."
      />

      {/* Hero Section */}
      <div className="relative bg-white border-b border-gray-100 overflow-hidden">
        {/* Background Decor elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[80%] rounded-full bg-indigo-50/50 blur-3xl"></div>
            <div className="absolute top-[20%] -left-[10%] w-[30%] h-[60%] rounded-full bg-purple-50/50 blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16 lg:py-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-indigo-100 text-indigo-600 text-sm font-medium mb-6 shadow-sm">
            <Sparkles size={14} className="fill-indigo-100" />
            <span>Senior Full-Stack Engineering Portfolio</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
            Engineering the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Future of Web</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Deep dives into React, Scalable Systems, Accessibility, and AI-Driven 
            Development. Built with the MERN Stack.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative group mb-8 z-10">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                <Search size={20} />
            </div>
            <input 
                type="text" 
                aria-label="Search articles"
                placeholder="Search articles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-2xl border border-gray-200 shadow-lg shadow-indigo-100/50 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-lg outline-none transition-all"
            />
          </div>

          {/* Trending Topics */}
          {!isLoading && popularTags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 items-center relative z-10">
                  <span className="text-sm font-semibold text-gray-500 flex items-center gap-1 mr-2">
                      <TrendingUp size={14} /> Trending:
                  </span>
                  {popularTags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            searchQuery === tag 
                            ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
                            : 'bg-white border border-gray-100 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                        }`}
                      >
                          #{tag}
                      </button>
                  ))}
                  {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="text-xs font-medium text-red-500 hover:text-red-600 ml-2">Clear</button>
                  )}
              </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
            <div className="flex justify-center py-20">
                <Loader2 size={40} className="text-indigo-600 animate-spin" />
            </div>
        ) : (
            <div className="space-y-16">
                
                {/* Featured Post Section (Only when not searching) */}
                {featuredPost && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-1 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-gray-900">Featured Article</h2>
                        </div>
                        
                        <div 
                            onClick={() => navigate(`/post/${featuredPost.id}`)}
                            className="group relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 cursor-pointer grid grid-cols-1 md:grid-cols-2"
                        >
                            <div className="relative h-64 md:h-auto overflow-hidden">
                                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                <img 
                                    src={featuredPost.coverUrl} 
                                    alt={featuredPost.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-8 md:p-12 flex flex-col justify-center">
                                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">New</span>
                                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(featuredPost.createdAt).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><Clock size={14}/> {featuredPost.readTimeMinutes} min read</span>
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
                                    {featuredPost.title}
                                </h3>
                                <p className="text-gray-600 mb-8 line-clamp-3 text-lg leading-relaxed">
                                    {featuredPost.excerpt}
                                </p>
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-3">
                                        <img src={featuredPost.authorAvatar} alt={featuredPost.authorName} className="w-10 h-10 rounded-full border border-gray-100" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{featuredPost.authorName}</p>
                                            <p className="text-xs text-gray-500">Author</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Post Grid */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {searchQuery ? `Results for "${searchQuery}"` : 'Latest Articles'}
                        </h2>
                        {!isLoading && <div className="hidden sm:block text-sm text-gray-500 font-medium">Showing {gridPosts.length} posts</div>}
                    </div>

                    {gridPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {gridPosts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Search size={32} />
                            </div>
                            <h3 className="text-xl font-medium text-gray-900">No posts found</h3>
                            <p className="text-gray-500 mt-2">We couldn't find anything matching your search.</p>
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="mt-6 text-indigo-600 font-medium hover:underline"
                            >
                                Clear search
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Newsletter Section */}
      <div className="bg-gray-900 py-20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl transform translate-y-1/2 translate-x-1/2"></div>
             <div className="absolute left-0 top-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl transform -translate-y-1/2 -translate-x-1/2"></div>
          </div>
          
          <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/10">
                  <Mail size={32} className="text-indigo-300" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Stay in the loop</h2>
              <p className="text-gray-400 mb-10 max-w-lg mx-auto text-lg">Get the latest articles, tutorials, and insights delivered straight to your inbox. No spam, we promise.</p>
              
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input 
                    type="email" 
                    aria-label="Email address for newsletter"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-grow px-5 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-sm transition-all"
                    required
                  />
                  <button 
                    type="submit" 
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 whitespace-nowrap transform hover:-translate-y-0.5"
                  >
                      {subscribed ? 'Subscribed!' : 'Subscribe'}
                  </button>
              </form>
          </div>
      </div>
    </div>
  );
};

export default Home;