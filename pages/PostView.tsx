import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trash2, Edit2, Clock, ArrowLeft, Calendar, Loader2, Heart, Volume2, Pause, Play, Globe, Share2, Linkedin, Twitter, Link as LinkIcon, Check, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Mic } from 'lucide-react';
import { BlogPost, User } from '../types';
import { api } from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CommentSection from '../components/CommentSection';
import AskArticleWidget from '../components/AskArticleWidget';
import PostCard from '../components/PostCard';
import SEO from '../components/SEO';
import { useToast } from '../context/ToastContext';

interface PostViewProps {
  user: User | null;
}

interface TranslatedContent {
  title: string;
  content: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

const PostView: React.FC<PostViewProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const [author, setAuthor] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false); // Local session state for demo
  const [isDeleting, setIsDeleting] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Translation State
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<Record<string, TranslatedContent>>({});

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);

  // Carousel Ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        setIsLoading(true);
        try {
            const found = await api.getPostById(id);
            if (found) {
                setPost(found);
                setLikes(found.likes || 0);
                
                // Check bookmark status
                if (user) {
                    const currentUser = await api.getCurrentUser();
                    if (currentUser && currentUser.bookmarks) {
                        setIsBookmarked(currentUser.bookmarks.includes(found.id));
                    }
                }

                // Fetch Author Profile
                try {
                    const authorData = await api.getUserProfile(found.authorId);
                    if (authorData) setAuthor(authorData);
                } catch (e) {
                    console.error("Failed to fetch author", e);
                }

                // Fetch related posts
                const allPosts = await api.getPosts();
                const related = allPosts
                    .filter(p => p.id !== found.id)
                    .sort((a, b) => {
                        // Sort by tag intersection count
                        const aTags = a.tags || [];
                        const bTags = b.tags || [];
                        const currentTags = found.tags || [];
                        const aMatch = aTags.filter(t => currentTags.includes(t)).length;
                        const bMatch = bTags.filter(t => currentTags.includes(t)).length;
                        return bMatch - aMatch;
                    })
                    .slice(0, 8); // Increased from 3 to 8 for carousel
                setRelatedPosts(related);

            } else {
                navigate('/');
            }
        } catch (e) {
            console.error(e);
            navigate('/');
        } finally {
            setIsLoading(false);
        }
      };
      fetchPost();
      
      // Reset scroll
      window.scrollTo(0, 0);
    }
  }, [id, navigate, user]);

  // Scroll Progress Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = totalScroll / windowHeight;
      setScrollProgress(Number.isNaN(progress) ? 0 : progress);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
        if (audioSource) {
            audioSource.stop();
        }
        if (audioContext) {
            audioContext.close();
        }
    };
  }, [audioSource, audioContext]);

  const handleDelete = async () => {
    if (post && window.confirm("Are you sure you want to delete this post?")) {
      setIsDeleting(true);
      try {
          await api.deletePost(post.id);
          showToast("Post deleted successfully", 'success');
          navigate('/');
      } catch (e) {
          console.error("Delete failed", e);
          setIsDeleting(false);
          showToast("Failed to delete post", 'error');
      }
    }
  };

  const handleLike = async () => {
    if (!post) return;
    setLikes(prev => prev + 1);
    setHasLiked(true);
    try { await api.toggleLike(post.id); } catch(e) { console.error(e); }
  };

  const handleBookmark = async () => {
      if (!post || !user) {
          showToast("Please sign in to save articles", 'info');
          navigate('/login');
          return;
      }
      const prev = isBookmarked;
      setIsBookmarked(!prev); // Optimistic update
      
      try {
          await api.toggleBookmark(post.id);
          showToast(!prev ? "Article saved to reading list" : "Article removed from reading list", 'success');
      } catch (e) {
          console.error(e);
          setIsBookmarked(prev); // Revert on error
          showToast("Failed to update bookmark", 'error');
      }
  };

  const handleShare = (platform: string) => {
    if (!post) return;
    const url = window.location.href;
    const text = `Check out "${post.title}" on MyBlog`;
    
    if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        showToast("Link copied to clipboard!", 'success');
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    if (!post) return;
    
    if (lang === 'en') {
      setCurrentLanguage('en');
      return;
    }

    // Check cache first
    if (translations[lang]) {
      setCurrentLanguage(lang);
      return;
    }

    // Translate
    setIsTranslating(true);
    try {
      const result = await api.translatePost(post.title, post.content, LANGUAGES.find(l => l.code === lang)?.label || lang);
      setTranslations(prev => ({ ...prev, [lang]: result }));
      setCurrentLanguage(lang);
      showToast(`Translated to ${LANGUAGES.find(l => l.code === lang)?.label}`, 'success');
    } catch (error) {
      console.error("Translation failed", error);
      showToast("Failed to translate content.", 'error');
      setCurrentLanguage('en'); // Revert on failure
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!post) return;

    if (isPlaying && audioSource) {
        audioSource.stop();
        setIsPlaying(false);
        return;
    }

    setIsAudioLoading(true);

    try {
        const textToRead = `${post.title}. ${post.excerpt}. ${post.content}`.substring(0, 1000); 
        const base64Audio = await api.generateAudio(textToRead);

        if (!base64Audio) throw new Error("No audio returned");

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        setAudioContext(ctx);

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
             channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(false);
        source.start(0);

        setAudioSource(source);
        setIsPlaying(true);

    } catch (error) {
        console.error("Audio playback failed", error);
        showToast("Failed to play audio.", 'error');
    } finally {
        setIsAudioLoading(false);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
        const { current } = scrollContainerRef;
        const scrollAmount = 340; // Approx card width + gap
        if (direction === 'left') {
            current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-white">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
      );
  }

  if (!post) return null;

  const isAuthor = user && user.id === post.authorId;
  const isAdmin = user && user.role === 'admin';
  const canEdit = isAuthor || isAdmin;

  const displayTitle = currentLanguage === 'en' ? post.title : translations[currentLanguage]?.title || post.title;
  const displayContent = currentLanguage === 'en' ? post.content : translations[currentLanguage]?.content || post.content;

  return (
    <div className="min-h-screen bg-white pb-20">
      
      <SEO 
        title={post.title} 
        description={post.excerpt} 
        image={post.coverUrl}
        type="article"
      />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 h-1.5 bg-indigo-100 z-[60] w-full">
         <div 
            className="h-full bg-indigo-600 transition-all duration-150 ease-out" 
            style={{ width: `${scrollProgress * 100}%` }}
         />
      </div>

      {/* Hero Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gray-900/40 z-10" />
        <img
          src={post.coverUrl}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end">
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
                <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Back to Home
                </Link>
                
                {isTranslating ? (
                  <div className="h-16 w-3/4 bg-white/20 animate-pulse rounded-lg mb-6"></div>
                ) : (
                   <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                      {displayTitle}
                   </h1>
                )}
                
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {post.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-xs font-semibold tracking-wide">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-6 text-white/90">
                    <div className="flex items-center gap-3">
                        <img 
                            src={post.authorAvatar} 
                            alt={post.authorName} 
                            className="w-10 h-10 rounded-full border-2 border-white/50"
                        />
                        <span className="font-medium text-lg">{post.authorName}</span>
                    </div>
                    <div className="h-1 w-1 bg-white/50 rounded-full"></div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar size={16} />
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="h-1 w-1 bg-white/50 rounded-full"></div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock size={16} />
                        <span>{post.readTimeMinutes} min read</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-30">
        <div className="bg-white rounded-t-3xl p-8 md:p-12 shadow-sm min-h-[200px]">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={handleLike}
                        disabled={hasLiked}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all transform active:scale-95 ${
                            hasLiked 
                            ? 'bg-rose-50 text-rose-600 cursor-default' 
                            : 'bg-gray-50 text-gray-600 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                        title="Like this post"
                    >
                        <Heart size={20} fill={hasLiked ? "currentColor" : "none"} />
                        <span className="font-semibold">{likes}</span>
                    </button>

                    <button
                        onClick={handleBookmark}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all transform active:scale-95 ${
                            isBookmarked
                            ? 'bg-amber-50 text-amber-600' 
                            : 'bg-gray-50 text-gray-600 hover:bg-amber-50 hover:text-amber-600'
                        }`}
                        title={isBookmarked ? "Remove from reading list" : "Save to reading list"}
                    >
                        {isBookmarked ? <BookmarkCheck size={20} fill="currentColor" /> : <Bookmark size={20} />}
                        <span className="font-medium hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                        onClick={handlePlayAudio}
                        disabled={isAudioLoading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
                            isPlaying
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-600 hover:text-indigo-600'
                        }`}
                    >
                        {isAudioLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={20} fill="currentColor" />
                        ) : (
                            <Play size={20} fill="currentColor" />
                        )}
                        <span className="font-medium text-sm">
                            {isAudioLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Listen'}
                        </span>
                    </button>

                    <div className="relative flex items-center bg-gray-50 rounded-full border border-gray-200 px-3 py-2 hover:border-indigo-300 transition-colors">
                       {isTranslating ? <Loader2 size={18} className="animate-spin text-indigo-600 mr-2" /> : <Globe size={18} className="text-gray-500 mr-2" />}
                       <select 
                          value={currentLanguage}
                          onChange={handleLanguageChange}
                          disabled={isTranslating}
                          className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer appearance-none pr-4"
                          style={{ minWidth: '80px' }}
                       >
                          {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                          ))}
                       </select>
                    </div>
                </div>

                {/* Author/Admin Tools */}
                {canEdit && (
                    <div className="flex gap-3">
                        {isAuthor && (
                            <button
                            onClick={() => navigate(`/edit/${post.id}`)}
                            className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-sm font-medium"
                            >
                            <Edit2 size={16} />
                            Edit
                            </button>
                        )}
                        <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                        >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Delete
                        </button>
                    </div>
                )}
            </div>
            
            {/* Original Audio Recording Player */}
            {post.audioUrl && (
                <div className="mb-10 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
                            <Mic size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900">Original Voice Recording</h3>
                    </div>
                    <audio src={post.audioUrl} controls className="w-full h-10 shadow-sm rounded-lg" />
                </div>
            )}

            <div className="prose prose-lg prose-indigo max-w-none text-gray-800 leading-8">
               {isTranslating ? (
                 <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    <div className="h-32 bg-gray-100 rounded w-full my-8"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                 </div>
               ) : (
                 <MarkdownRenderer content={displayContent} />
               )}
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-100">
                <h4 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                    <Share2 size={18} />
                    Share this article
                </h4>
                <div className="flex gap-3">
                    <button onClick={() => handleShare('twitter')} className="p-3 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition-colors">
                        <Twitter size={20} />
                    </button>
                    <button onClick={() => handleShare('linkedin')} className="p-3 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors">
                        <Linkedin size={20} />
                    </button>
                    <button onClick={() => handleShare('copy')} className="p-3 bg-gray-50 text-gray-700 rounded-full hover:bg-gray-100 transition-colors relative">
                        {isCopied ? <Check size={20} className="text-green-600"/> : <LinkIcon size={20} />}
                        {isCopied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded">Copied!</span>}
                    </button>
                </div>
            </div>

            {author && (
                <div className="mt-12 p-8 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                    <div className="flex-shrink-0">
                        <img 
                            src={author.avatarUrl} 
                            alt={author.username} 
                            className="w-20 h-20 rounded-full border-4 border-white shadow-sm"
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1 capitalize">{author.username}</h3>
                        <p className="text-sm font-medium text-indigo-600 mb-3">Author</p>
                        <p className="text-gray-600 leading-relaxed max-w-2xl">
                            {author.bio || `Hi there! I'm ${author.username}, a writer on MyBlog sharing my thoughts and experiences.`}
                        </p>
                    </div>
                </div>
            )}

            <CommentSection 
                postId={post.id} 
                initialComments={post.comments || []} 
                user={user} 
            />
        </div>
      </div>
      
      {relatedPosts.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-20">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-2xl font-bold text-gray-900">Related Articles</h3>
                 {relatedPosts.length > 3 && (
                     <div className="flex gap-2">
                         <button onClick={() => scrollCarousel('left')} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors" aria-label="Scroll left">
                             <ChevronLeft size={20} />
                         </button>
                         <button onClick={() => scrollCarousel('right')} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors" aria-label="Scroll right">
                             <ChevronRight size={20} />
                         </button>
                     </div>
                 )}
              </div>
              
              <div 
                  ref={scrollContainerRef}
                  className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scroll-smooth hide-scrollbar"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                  {relatedPosts.map(p => (
                      <div key={p.id} className="min-w-[280px] md:min-w-[340px] snap-center">
                          <PostCard post={p} />
                      </div>
                  ))}
              </div>
              <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
              `}</style>
          </div>
      )}

      <AskArticleWidget articleContent={`${post.title}\n\n${post.content}`} />
    </div>
  );
};

export default PostView;