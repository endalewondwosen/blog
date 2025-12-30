import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BlogPost } from '../types';
import { api } from '../services/api';
import { Calendar, FileText, Heart, Edit2, Trash2, Loader2, Plus, Bookmark, PenSquare, BookmarkMinus, TrendingUp, ArrowRight } from 'lucide-react';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<BlogPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch Published Posts
  useEffect(() => {
    const fetchUserPosts = async () => {
        setIsLoading(true);
        try {
            const data = await api.getPostsByUser(user.id);
            setPosts(data);
        } catch (error) {
            console.error("Failed to fetch user posts", error);
        } finally {
            setIsLoading(false);
        }
    };
    if (activeTab === 'posts') {
        fetchUserPosts();
    }
  }, [user.id, activeTab]);

  // Fetch Saved Posts
  useEffect(() => {
    const fetchSavedPosts = async () => {
        setIsLoading(true);
        try {
            // Get fresh user data to ensure bookmarks are up to date
            const currentUser = await api.getCurrentUser();
            if (currentUser && currentUser.bookmarks && currentUser.bookmarks.length > 0) {
                const data = await api.getBookmarkedPosts(currentUser.bookmarks);
                setSavedPosts(data);
            } else {
                setSavedPosts([]);
                
                // If empty, fetch trending posts for recommendations
                const allPosts = await api.getPosts();
                const popular = allPosts.sort((a,b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3);
                setTrendingPosts(popular);
            }
        } catch (error) {
            console.error("Failed to fetch saved posts", error);
        } finally {
            setIsLoading(false);
        }
    };
    if (activeTab === 'saved') {
        fetchSavedPosts();
    }
  }, [activeTab]);

  const handleDelete = async (e: React.MouseEvent, postId: string) => {
      e.stopPropagation(); // Prevent navigating to the post if container is clickable
      
      if (window.confirm("Are you sure you want to delete this post?")) {
          setDeletingId(postId);
          try {
              await api.deletePost(postId);
              setPosts(prev => prev.filter(p => p.id !== postId));
          } catch (e) {
              console.error("Delete failed", e);
              alert("Failed to delete post");
          } finally {
              setDeletingId(null);
          }
      }
  };

  const handleRemoveBookmark = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
        await api.toggleBookmark(postId);
        setSavedPosts(prev => prev.filter(p => p.id !== postId));
        
        // If we removed the last one, fetch trending
        if (savedPosts.length <= 1) {
            const allPosts = await api.getPosts();
            const popular = allPosts.sort((a,b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3);
            setTrendingPosts(popular);
        }
    } catch (e) {
        console.error("Failed to remove bookmark", e);
    }
  };

  const totalLikes = posts.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  const displayedPosts = activeTab === 'posts' ? posts : savedPosts;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-10 flex flex-col sm:flex-row items-center gap-8">
         <img 
            src={user.avatarUrl} 
            alt={user.username} 
            className="w-32 h-32 rounded-full border-4 border-indigo-50 shadow-inner"
         />
         <div className="text-center sm:text-left flex-grow">
             <h1 className="text-3xl font-bold text-gray-900 mb-2 capitalize">{user.username}</h1>
             <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-500 mb-6">
                 <div className="flex items-center gap-1.5">
                     <Calendar size={16} />
                     <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                 </div>
             </div>
             
             {/* Stats */}
             <div className="flex justify-center sm:justify-start gap-8">
                 <div className="text-center sm:text-left">
                     <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
                     <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Published</div>
                 </div>
                 <div className="text-center sm:text-left">
                     <div className="text-2xl font-bold text-gray-900">{totalLikes}</div>
                     <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Likes</div>
                 </div>
             </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
          <button
              onClick={() => setActiveTab('posts')}
              className={`pb-4 px-6 font-medium text-sm transition-all relative ${
                  activeTab === 'posts' 
                  ? 'text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
          >
              <span className="flex items-center gap-2">
                  <PenSquare size={18} /> My Articles
              </span>
              {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
          </button>
          
          <button
              onClick={() => setActiveTab('saved')}
              className={`pb-4 px-6 font-medium text-sm transition-all relative ${
                  activeTab === 'saved' 
                  ? 'text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
          >
               <span className="flex items-center gap-2">
                  <Bookmark size={18} /> Reading List
              </span>
              {activeTab === 'saved' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
          </button>
      </div>

      {/* Content Header */}
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === 'posts' ? 'Published Articles' : 'Reading List'}
          </h2>
          {activeTab === 'posts' && (
            <button 
                onClick={() => navigate('/create')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
                <Plus size={16} />
                New Post
            </button>
          )}
      </div>

      {isLoading ? (
          <div className="flex justify-center py-20">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
          </div>
      ) : displayedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
                      <div className="relative h-40 overflow-hidden bg-gray-100">
                          <img 
                             src={post.coverUrl} 
                             alt={post.title} 
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                              <Heart size={12} className="text-rose-500 fill-rose-500" />
                              {post.likes}
                          </div>
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                              <Calendar size={12} />
                              {new Date(post.createdAt).toLocaleDateString()}
                          </div>
                          
                          <div className="mt-auto flex gap-2 pt-4 border-t border-gray-50">
                              <button 
                                 className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                  <FileText size={16} /> View
                              </button>
                              
                              {activeTab === 'posts' ? (
                                  <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/edit/${post.id}`); }}
                                        className="flex-1 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, post.id)}
                                        disabled={deletingId === post.id}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                                        title="Delete Post"
                                    >
                                        {deletingId === post.id ? <Loader2 size={16} className="animate-spin text-red-600" /> : <Trash2 size={16} />}
                                    </button>
                                  </>
                              ) : (
                                <button 
                                    onClick={(e) => handleRemoveBookmark(e, post.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                                    title="Remove from reading list"
                                >
                                    <BookmarkMinus size={16} />
                                </button>
                              )}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  {activeTab === 'posts' ? <FileText size={32} /> : <Bookmark size={32} />}
              </div>
              <h3 className="text-xl font-medium text-gray-900">
                  {activeTab === 'posts' ? 'No posts yet' : 'Reading list empty'}
              </h3>
              <p className="text-gray-500 mt-2 mb-6">
                  {activeTab === 'posts' ? 'Share your first story with the world!' : 'Save interesting stories to read them here.'}
              </p>
              {activeTab === 'posts' ? (
                <button 
                    onClick={() => navigate('/create')}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
                >
                    Write Article
                </button>
              ) : (
                <div className="flex flex-col items-center">
                    <button 
                        onClick={() => navigate('/')}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Explore Articles
                    </button>

                    {/* Trending Recommendations inside Empty State */}
                    {trendingPosts.length > 0 && (
                        <div className="mt-12 w-full max-w-4xl border-t border-gray-100 pt-10">
                            <h4 className="font-bold text-gray-900 mb-6 flex items-center justify-center gap-2">
                                <TrendingUp size={18} className="text-indigo-600"/> 
                                Trending on MyBlog
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                                {trendingPosts.map(p => (
                                    <div key={p.id} onClick={() => navigate(`/post/${p.id}`)} className="cursor-pointer group bg-gray-50 hover:bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-md rounded-xl p-4 transition-all">
                                        <div className="relative h-24 mb-3 rounded-lg overflow-hidden">
                                            <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover" />
                                        </div>
                                        <h5 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{p.title}</h5>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{p.readTimeMinutes} min read</span>
                                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 text-indigo-600 transition-opacity -translate-x-2 group-hover:translate-x-0"/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              )}
          </div>
      )}
    </div>
  );
};

export default Profile;