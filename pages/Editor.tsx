import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Wand2, ArrowLeft, Loader2, Image as ImageIcon, Sparkles, X, Eye, PenLine, Tag, MessageSquare, List, ImagePlus } from 'lucide-react';
import { BlogPost, User, ContentReview } from '../types';
import { api } from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface EditorProps {
  user: User;
}

const Editor: React.FC<EditorProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState(`https://picsum.photos/800/400?random=${Date.now()}`);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  
  // Modals
  const [aiTopic, setAiTopic] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);

  // AI Assistant State
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [review, setReview] = useState<ContentReview | null>(null);
  const [isAssistLoading, setIsAssistLoading] = useState<string | null>(null); // 'tags', 'titles', 'review'

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
          setIsLoadingPost(true);
          try {
              const post = await api.getPostById(id);
              if (post) {
                if (post.authorId !== user.id) {
                    alert("You can only edit your own posts.");
                    navigate('/');
                    return;
                }
                setTitle(post.title);
                setContent(post.content);
                setCoverUrl(post.coverUrl);
                setTags(post.tags || []);
              } else {
                  navigate('/');
              }
          } catch (e) {
              console.error(e);
              navigate('/');
          } finally {
              setIsLoadingPost(false);
          }
      };
      fetchPost();
    }
  }, [id, user.id, navigate]);

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) return;
    
    setIsGenerating(true);
    try {
      if (!title) setTitle(aiTopic);
      
      const generatedContent = await api.generateContent(aiTopic);
      setContent(generatedContent);
      setShowAiModal(false);
    } catch (error) {
      console.error(error);
      alert("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
        const imageUrl = await api.generateCoverImage(imagePrompt);
        if (imageUrl) {
            setCoverUrl(imageUrl);
            setShowImageModal(false);
            setImagePrompt('');
        } else {
            alert("Could not generate image. Please try again.");
        }
    } catch (e) {
        console.error(e);
        alert("Image generation failed.");
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
      setTagInput('');
    }
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
        setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // --- AI Assistant Handlers ---

  const handleSuggestTags = async () => {
      if (!content.trim()) return alert("Write some content first!");
      setIsAssistLoading('tags');
      try {
          const newTags = await api.generateSmartTags(content);
          setSuggestedTags(newTags);
      } catch(e) { console.error(e); } finally { setIsAssistLoading(null); }
  };

  const handleOptimizeTitle = async () => {
      if (!content.trim()) return alert("Write some content first!");
      setIsAssistLoading('titles');
      try {
          const titles = await api.generateTitleSuggestions(title, content);
          setSuggestedTitles(titles);
      } catch(e) { console.error(e); } finally { setIsAssistLoading(null); }
  };

  const handleReviewContent = async () => {
      if (!content.trim()) return alert("Write some content first!");
      setIsAssistLoading('review');
      try {
          const reviewResult = await api.generateContentReview(content);
          setReview(reviewResult);
      } catch(e) { console.error(e); } finally { setIsAssistLoading(null); }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    try {
        let excerpt = content.substring(0, 150) + "...";
        try {
            excerpt = await api.generateSummary(content);
        } catch(e) {
            console.warn("Summary generation failed, using fallback");
        }

        const postData = {
            title,
            content,
            excerpt,
            coverUrl: coverUrl || `https://picsum.photos/800/400?random=${Date.now()}`,
            tags,
            authorId: user.id,
            authorName: user.username,
            authorAvatar: user.avatarUrl,
            readTimeMinutes: Math.ceil(content.split(' ').length / 200),
        };

        if (id) {
            await api.updatePost(id, postData);
        } else {
            await api.createPost(postData);
        }

        navigate('/');
    } catch (error) {
        console.error("Save failed", error);
        alert("Failed to save post");
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoadingPost) {
      return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <button 
          onClick={() => navigate('/')} 
          className="text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors self-start sm:self-center"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium text-sm flex-grow sm:flex-grow-0 justify-center"
            >
                <Wand2 size={18} />
                <span>Magic Draft</span>
            </button>
            <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium border text-sm flex-grow sm:flex-grow-0 justify-center ${
                  isPreviewMode 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
                {isPreviewMode ? <PenLine size={18} /> : <Eye size={18} />}
                <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
            </button>
            <button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim() || isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[100px] justify-center text-sm flex-grow sm:flex-grow-0"
            >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
                {/* Cover Image Input (Collapsed if Preview Mode) */}
                {!isPreviewMode && (
                  <div className="relative h-48 bg-gray-50 border-b border-gray-100 group shrink-0">
                      {coverUrl ? (
                          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <ImageIcon size={48} className="mb-2" />
                              <span>Add Cover Image</span>
                          </div>
                      )}
                      
                      {/* Image Controls Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                           <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Cover Image URL" 
                                    value={coverUrl}
                                    onChange={(e) => setCoverUrl(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-200 shadow-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/90 backdrop-blur"
                                />
                           </div>
                           <button 
                                onClick={() => setShowImageModal(true)}
                                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-lg"
                           >
                                <ImagePlus size={16} />
                                Generate
                           </button>
                      </div>
                  </div>
                )}

                <div className="p-8 flex-grow flex flex-col">
                    {/* Title */}
                    {!isPreviewMode ? (
                        <input
                            type="text"
                            placeholder="Article Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-3xl md:text-4xl font-bold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 mb-6 bg-transparent outline-none"
                        />
                    ) : (
                         <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 border-b pb-4">{title || "Untitled"}</h1>
                    )}

                    {/* Content Area or Preview */}
                    <div className="flex-grow">
                        {isPreviewMode ? (
                            <div className="prose prose-indigo max-w-none">
                                <MarkdownRenderer content={content} />
                                {!content && <p className="text-gray-400 italic">No content to preview.</p>}
                            </div>
                        ) : (
                            <textarea
                                placeholder="Tell your story... (Markdown supported)"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-full min-h-[400px] text-lg text-gray-700 leading-relaxed placeholder-gray-300 border-none focus:ring-0 p-0 resize-none bg-transparent outline-none font-mono"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Sidebar / Settings / AI Assistant */}
        <div className="space-y-6">
            
            {/* AI Assistant Panel */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 p-6">
                <div className="flex items-center gap-2 mb-4 text-indigo-700">
                    <Sparkles size={20} />
                    <h3 className="font-bold">AI Assistant</h3>
                </div>

                <div className="space-y-4">
                    {/* Title Optimizer */}
                    <div>
                        <button 
                            onClick={handleOptimizeTitle}
                            disabled={isAssistLoading === 'titles'}
                            className="w-full flex items-center justify-between text-left text-sm font-medium text-gray-700 bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                        >
                            <span className="flex items-center gap-2"><List size={16} /> Optimize Title</span>
                            {isAssistLoading === 'titles' && <Loader2 size={14} className="animate-spin" />}
                        </button>
                        {suggestedTitles.length > 0 && (
                            <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                                {suggestedTitles.map((t, i) => (
                                    <button key={i} onClick={() => setTitle(t)} className="w-full text-left text-xs p-2 bg-white/50 hover:bg-white rounded border border-transparent hover:border-indigo-200 transition-colors text-gray-600 hover:text-indigo-700">
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Smart Tags */}
                    <div>
                        <button 
                            onClick={handleSuggestTags}
                            disabled={isAssistLoading === 'tags'}
                            className="w-full flex items-center justify-between text-left text-sm font-medium text-gray-700 bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                        >
                            <span className="flex items-center gap-2"><Tag size={16} /> Suggest Tags</span>
                            {isAssistLoading === 'tags' && <Loader2 size={14} className="animate-spin" />}
                        </button>
                         {suggestedTags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1 animate-in fade-in slide-in-from-top-2">
                                {suggestedTags.map((t, i) => (
                                    <button key={i} onClick={() => addTag(t)} className="text-xs px-2 py-1 bg-white/50 hover:bg-indigo-100 rounded border border-transparent hover:border-indigo-200 transition-colors text-indigo-600">
                                        #{t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Review */}
                    <div>
                        <button 
                            onClick={handleReviewContent}
                            disabled={isAssistLoading === 'review'}
                            className="w-full flex items-center justify-between text-left text-sm font-medium text-gray-700 bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                        >
                            <span className="flex items-center gap-2"><MessageSquare size={16} /> Content Review</span>
                            {isAssistLoading === 'review' && <Loader2 size={14} className="animate-spin" />}
                        </button>
                        {review && (
                             <div className="mt-2 p-3 bg-white/80 rounded-lg text-xs space-y-2 border border-gray-200 animate-in fade-in slide-in-from-top-2">
                                <p className="font-semibold text-gray-800">{review.critique}</p>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                    {review.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                                </ul>
                             </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Standard Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Post Settings</h3>
                
                {/* Tagging System */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 hover:text-indigo-900 focus:outline-none">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                    />
                </div>

                <div className="space-y-3 text-sm text-gray-500">
                     <p>Use <strong>Markdown</strong> to format your post:</p>
                     <ul className="list-disc pl-5 space-y-1">
                         <li># for Headers</li>
                         <li>**bold** text</li>
                         <li>*italic* text</li>
                         <li>- list items</li>
                         <li>`code` inline</li>
                     </ul>
                </div>
            </div>
        </div>
      </div>

      {/* AI Draft Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-indigo-600">
                <Wand2 size={24} />
                <h3 className="text-xl font-bold text-gray-900">AI Writing Assistant</h3>
            </div>
            <p className="text-gray-600 mb-6">
                Enter a topic or a few keywords, and Gemini will generate a draft for you.
            </p>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. The benefits of meditation for developers"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-6 outline-none"
              autoFocus
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || !aiTopic.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-70 transition-colors font-medium"
              >
                {isGenerating ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Generating...</span>
                    </>
                ) : (
                    <>
                        <Sparkles size={18} />
                        <span>Generate Draft</span>
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-indigo-600">
                <ImageIcon size={24} />
                <h3 className="text-xl font-bold text-gray-900">Cover Image Generator</h3>
            </div>
            <p className="text-gray-600 mb-6">
                Describe the image you want for your cover, and Gemini will create it.
            </p>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">Image Description</label>
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="e.g. A futuristic city with neon lights, digital art style"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-6 outline-none"
              autoFocus
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-70 transition-colors font-medium"
              >
                {isGeneratingImage ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Creating...</span>
                    </>
                ) : (
                    <>
                        <Wand2 size={18} />
                        <span>Generate</span>
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;