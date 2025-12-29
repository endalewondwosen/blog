require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenAI } = require('@google/genai');

const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/novablog')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Missing credentials' });

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username: username.toLowerCase(),
      password: hashedPassword,
      avatarUrl: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 1000)}`
    });
    
    await user.save();
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET CURRENT USER
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.sendStatus(404);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Posts
app.get('/api/posts', async (req, res) => {
  try {
    const filter = req.query.author ? { authorId: req.query.author } : {};
    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Single Post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Post
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const newPost = new Post({ ...req.body, authorId: req.user.id }); // Enforce author ID from token
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Post
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    // In production, ensure only author can update
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Post
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    // In production, ensure only author can delete
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// AI Generation Endpoint (Same as before)
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { topic, type, title, context, targetLanguage } = req.body;
    let prompt = '';
    let responseMimeType = 'text/plain';
    
    // Config for different AI tasks
    if (type === 'summary') {
      prompt = `Summarize the following blog post content into a short excerpt (maximum 2 sentences):\n\n${topic.substring(0, 1000)}...`;
    } else if (type === 'tags') {
      prompt = `Analyze the following blog post content and generate 5 relevant, SEO-friendly tags. Return ONLY a JSON array of strings, e.g. ["Tag1", "Tag2"]. Do not use markdown formatting in response.\n\nContent:\n${topic.substring(0, 2000)}`;
      responseMimeType = 'application/json';
    } else if (type === 'titles') {
      prompt = `Analyze the blog post content and the current title: "${title}". Generate 5 alternative, catchy, and SEO-optimized titles. Return ONLY a JSON array of strings. Do not use markdown formatting in response.\n\nContent:\n${topic.substring(0, 2000)}`;
      responseMimeType = 'application/json';
    } else if (type === 'review') {
      prompt = `Act as an expert editor. Analyze the following blog post for tone, clarity, and engagement. Provide a brief critique (max 2 sentences) and 3 specific, actionable improvements. Return ONLY a JSON object with keys "critique" (string) and "improvements" (array of strings).\n\nContent:\n${topic.substring(0, 2000)}`;
      responseMimeType = 'application/json';
    } else if (type === 'qa') {
      prompt = `You are a helpful assistant for a blog reader. Answer the user's question based ONLY on the provided article content below. If the answer is not found in the article, politely say "I couldn't find the answer in this article." Keep your answer concise and friendly.\n\nArticle Content:\n${context.substring(0, 10000)}\n\nUser Question:\n${topic}`;
    } else if (type === 'translate') {
      prompt = `Translate the following blog post title and content into ${targetLanguage}. Ensure you preserve all Markdown formatting (bold, italics, headers, code blocks, lists) exactly as they are in the original. The tone should remain professional and consistent with the original text. Return ONLY a JSON object with the following structure: { "title": "Translated Title", "content": "Translated Markdown Content" }. Original Title: ${title}. Original Content:\n${topic.substring(0, 5000)}`;
      responseMimeType = 'application/json';
    } else if (type === 'image') {
       // Image Generation
       const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: topic + " high quality, stylized, blog cover image, 16:9 aspect ratio" }]
          },
          config: {
            imageConfig: { aspectRatio: "16:9" }
          }
       });
       let imageBase64 = null;
       if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
          }
       }
       return res.json({ image: imageBase64 });

    } else if (type === 'audio') {
        // TTS
        const cleanText = topic.substring(0, 600).replace(/[#*`]/g, ''); 
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: cleanText }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return res.json({ audio: base64Audio });
    } else {
      prompt = `Write a comprehensive, engaging blog post about "${topic}". The tone should be professional. Use proper paragraph spacing. Do not include a title in the output, just the body content. Keep it under 500 words.`;
    }

    if (type !== 'image' && type !== 'audio') {
        const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType }
        });

        if (responseMimeType === 'application/json') {
            res.json({ result: JSON.parse(response.text) });
        } else {
            res.json({ text: response.text });
        }
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI Generation failed' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));