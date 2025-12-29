import React, { useState } from 'react';
import { Send, MessageCircle, User as UserIcon } from 'lucide-react';
import { Comment, User } from '../types';
import { api } from '../services/api';

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
  user: User | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, initialComments, user }) => {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const addedComment = await api.addComment(postId, {
        text: newComment,
        authorId: user.id,
        authorName: user.username,
        authorAvatar: user.avatarUrl
      });
      setComments([addedComment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error("Failed to post comment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 mt-10">
      <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold text-xl">
        <MessageCircle size={24} className="text-indigo-600" />
        <h3>Discussion ({comments.length})</h3>
      </div>

      {/* Input Area */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
          <img 
            src={user.avatarUrl} 
            alt="You" 
            className="w-10 h-10 rounded-full border border-gray-200 hidden sm:block" 
          />
          <div className="flex-grow relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What are your thoughts?"
              className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-white min-h-[100px]"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-6 bg-white rounded-xl border border-dashed border-gray-300 text-center">
            <p className="text-gray-600 mb-2">Join the discussion</p>
            <a href="/#/login" className="text-indigo-600 font-medium hover:underline">Sign in to leave a comment</a>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group">
              <img 
                src={comment.authorAvatar} 
                alt={comment.authorName} 
                className="w-10 h-10 rounded-full border border-gray-200 flex-shrink-0" 
              />
              <div className="flex-grow">
                <div className="flex items-baseline justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{comment.authorName}</h4>
                  <span className="text-xs text-gray-500">{getTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic text-center py-4">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;