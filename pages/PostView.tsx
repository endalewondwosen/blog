import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trash2, Edit2, Clock, ArrowLeft, Calendar, Loader2, Heart, Volume2, Pause, Play, Globe } from 'lucide-react';
import { BlogPost, User } from '../types';
import { api } from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CommentSection from '../components/CommentSection';
import AskArticleWidget from '../components/AskArticleWidget';

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
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false); // Local session state for demo
  
  // Translation State
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<Record<string, TranslatedContent>>({});

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        try {
            const found = await api.getPostById(id);
            if (found) {
                setPost(found);
                setLikes(found.likes || 0);
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
    }
  }, [id, navigate]);

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
      await api.deletePost(post.id);
      navigate('/');
    }
  };

  const handleLike = async () => {
    if (!post) return;
    setLikes(prev => prev + 1);
    setHasLiked(true);
    try { await api.toggleLike(post.id); } catch(e) { console.error(e); }
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
    } catch (error) {
      console.error("Translation failed", error);
      alert("Failed to translate content.");
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
        // Use current displayed content for audio if possible, but for now we stick to original English to keep voice consistent
        // Or strictly stick to original post text to save tokens/complexity.
        const textToRead = `${post.title}. ${post.excerpt}. ${post.content}`.substring(0, 1000); 
        const base64Audio = await api.generateAudio(textToRead);

        if (!base64Audio) throw new Error("No audio returned");

        // 2. Setup Audio Context
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        setAudioContext(ctx);

        // 3. Decode
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert PCM to AudioBuffer
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
             channelData[i] = dataInt16[i] / 32768.0;
        }

        // 4. Play
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(false);
        source.start(0);

        setAudioSource(source);
        setIsPlaying(true);

    } catch (error) {
        console.error("Audio playback failed", error);
        alert("Failed to play audio.");
    } finally {
        setIsAudioLoading(false);
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

  // Determine content to display
  const displayTitle = currentLanguage === 'en' ? post.title : translations[currentLanguage]?.title || post.title;
  const displayContent = currentLanguage === 'en' ? post.content : translations[currentLanguage]?.content || post.content;

  return (
    <div className="min-h-screen bg-white pb-20">
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
                
                {/* Title (Animated for translation switch) */}
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-30">
        <div className="bg-white rounded-t-3xl p-8 md:p-12 shadow-sm min-h-[200px]">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                
                <div className="flex flex-wrap items-center gap-3">
                     {/* Like Button */}
                    <button 
                        onClick={handleLike}
                        disabled={hasLiked}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all transform active:scale-95 ${
                            hasLiked 
                            ? 'bg-rose-50 text-rose-600 cursor-default' 
                            : 'bg-gray-50 text-gray-600 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                    >
                        <Heart size={20} fill={hasLiked ? "currentColor" : "none"} />
                        <span className="font-semibold">{likes}</span>
                    </button>

                     {/* Audio Player Button */}
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

                    {/* Language Selector */}
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

                {/* Author Tools */}
                {isAuthor && (
                    <div className="flex gap-3">
                        <button
                        onClick={() => navigate(`/edit/${post.id}`)}
                        className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-sm font-medium"
                        >
                        <Edit2 size={16} />
                        Edit
                        </button>
                        <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                        >
                        <Trash2 size={16} />
                        Delete
                        </button>
                    </div>
                )}
            </div>

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

            {/* Engagement Section */}
            <CommentSection 
                postId={post.id} 
                initialComments={post.comments || []} 
                user={user} 
            />
        </div>
      </div>

      {/* Floating Ask Widget (Always uses original content context for better accuracy) */}
      <AskArticleWidget articleContent={`${post.title}\n\n${post.content}`} />
    </div>
  );
};

export default PostView;