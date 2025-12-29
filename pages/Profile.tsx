import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BlogPost } from '../types';
import { api } from '../services/api';
import { Calendar, FileText, Heart, Edit2, Trash2, Loader2, Plus } from 'lucide-react';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPosts = async () => {
        try {
            const data = await api.getPostsByUser(user.id);
            setPosts(data);
        } catch (error) {
            console.error("Failed to fetch user posts", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchUserPosts();
  }, [user.id]);

  const handleDelete = async (postId: string) => {
      if (window.confirm("Are you sure you want to delete this post?")) {
          try {
              await api.deletePost(postId);
              setPosts(posts.filter(p => p.id !== postId));
          } catch (e) {
              console.error("Delete failed", e);
              alert("Failed to delete post");
          }
      }
  };

  const totalLikes = posts.reduce((acc, curr) => acc + (curr.likes || 0), 0);

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
                     <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Posts</div>
                 </div>
                 <div className="text-center sm:text-left">
                     <div className="text-2xl font-bold text-gray-900">{totalLikes}</div>
                     <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Likes</div>
                 </div>
             </div>
         </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Posts</h2>
          <button 
             onClick={() => navigate('/create')}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
              <Plus size={16} />
              New Post
          </button>
      </div>

      {isLoading ? (
          <div className="flex justify-center py-20">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
          </div>
      ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                  <div key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full">
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
                                 onClick={() => navigate(`/post/${post.id}`)}
                                 className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                  <FileText size={16} /> View
                              </button>
                              <button 
                                 onClick={() => navigate(`/edit/${post.id}`)}
                                 className="flex-1 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                  <Edit2 size={16} /> Edit
                              </button>
                              <button 
                                 onClick={() => handleDelete(post.id)}
                                 className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <FileText size={32} />
              </div>
              <h3 className="text-xl font-medium text-gray-900">No posts yet</h3>
              <p className="text-gray-500 mt-2 mb-6">Share your first story with the world!</p>
              <button 
                 onClick={() => navigate('/create')}
                 className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
              >
                  Write Article
              </button>
          </div>
      )}
    </div>
  );
};

export default Profile;