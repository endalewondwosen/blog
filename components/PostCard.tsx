import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Heart } from 'lucide-react';
import { BlogPost } from '../types';

interface PostCardProps {
  post: BlogPost;
  actions?: React.ReactNode;
  showAuthor?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, actions, showAuthor = true }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/post/${post.id}`)}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300 transform hover:-translate-y-1 h-full cursor-pointer"
    >
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gray-200 animate-pulse" /> {/* Loading placeholder effect underneath */}
        <img
          src={post.coverUrl}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Tags Overlay */}
        <div className="absolute top-4 left-4 flex gap-2">
            {post.tags && post.tags.slice(0, 2).map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-white/90 backdrop-blur-sm text-indigo-800 text-xs font-semibold rounded-md shadow-sm">
                    #{tag}
                </span>
            ))}
            {post.tags && post.tags.length > 2 && (
                <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-md shadow-sm">
                    +{post.tags.length - 2}
                </span>
            )}
        </div>

        {/* Likes Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm text-gray-700">
            <Heart size={12} className="text-rose-500 fill-rose-500" />
            {post.likes}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
            <span className="text-indigo-600">Article</span>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {post.title}
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
          {post.excerpt}
        </p>
        
        <div className="mt-auto pt-4 border-t border-gray-50">
            {actions ? (
                /* Render Custom Actions if provided (stops propagation to prevent card click) */
                <div onClick={(e) => e.stopPropagation()} className="flex gap-2 w-full">
                    {actions}
                </div>
            ) : (
                /* Standard Footer */
                <div className="flex items-center justify-between">
                    {showAuthor && (
                        <div className="flex items-center gap-2">
                            <img 
                                src={post.authorAvatar} 
                                alt={post.authorName}
                                className="w-6 h-6 rounded-full"
                            />
                            <span className="text-xs font-medium text-gray-700">{post.authorName}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 text-gray-400 text-xs ml-auto">
                        <Clock size={14} />
                        <span>{post.readTimeMinutes} min read</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;