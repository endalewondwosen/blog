import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBlogContent = async (topic: string, tone: string = 'professional'): Promise<string> => {
  const ai = getClient();
  
  try {
    const prompt = `Write a comprehensive, engaging blog post about "${topic}". 
    The tone should be ${tone}. 
    Use proper paragraph spacing. 
    Do not include a title in the output, just the body content.
    Keep it under 500 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateBlogSummary = async (content: string): Promise<string> => {
    const ai = getClient();
    try {
        const prompt = `Summarize the following blog post content into a short excerpt (maximum 2 sentences):\n\n${content.substring(0, 1000)}...`; // Limit input context
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text || "No summary available.";
    } catch (error) {
        console.error("Gemini API Error (Summary):", error);
        return content.substring(0, 150) + "..."; // Fallback
    }
}

export const generateSmartTags = async (content: string): Promise<string[]> => {
  const ai = getClient();
  try {
    const prompt = `Analyze the following blog post content and generate 5 relevant, SEO-friendly tags. Return ONLY a JSON array of strings, e.g. ["Tag1", "Tag2"]. Do not use markdown formatting in response.\n\nContent:\n${content.substring(0, 2000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini API Error (Tags):", error);
    return [];
  }
};

export const generateTitleSuggestions = async (currentTitle: string, content: string): Promise<string[]> => {
  const ai = getClient();
  try {
    const prompt = `Analyze the blog post content and the current title: "${currentTitle}". 
    Generate 5 alternative, catchy, and SEO-optimized titles. 
    Return ONLY a JSON array of strings. Do not use markdown formatting in response.\n\nContent:\n${content.substring(0, 2000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini API Error (Titles):", error);
    return [];
  }
};

export const generateContentReview = async (content: string): Promise<{ critique: string; improvements: string[] }> => {
  const ai = getClient();
  try {
    const prompt = `Act as an expert editor. Analyze the following blog post for tone, clarity, and engagement. 
    Provide a brief critique (max 2 sentences) and 3 specific, actionable improvements.
    Return ONLY a JSON object with keys "critique" (string) and "improvements" (array of strings).
    \n\nContent:\n${content.substring(0, 2000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error (Review):", error);
    return { critique: "Failed to generate review.", improvements: [] };
  }
};

export const generateCoverImage = async (prompt: string): Promise<string | null> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt + " high quality, stylized, blog cover image, 16:9 aspect ratio" }]
      },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });

    // Iterate through parts to find image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error (Image):", error);
    throw error;
  }
};

export const generateAudio = async (text: string): Promise<string | null> => {
  const ai = getClient();
  try {
    // Limit text to avoid quota issues for demo
    const cleanText = text.substring(0, 600).replace(/[#*`]/g, ''); 
    
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
    return base64Audio || null;
  } catch (error) {
    console.error("Gemini API Error (Audio):", error);
    throw error;
  }
};

export const generatePostFromAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = getClient();
  try {
    // Switch to gemini-2.0-flash-exp for robust multimodal audio support
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: "Listen to this audio recording. It contains a draft or thoughts for a blog post. Transcribe it and restructure it into a well-formatted, professional blog post with headers and paragraphs. Do not include a title."
          }
        ]
      }
    });

    return response.text || "Failed to transcribe audio.";
  } catch (error) {
    console.error("Gemini API Error (Voice-to-Text):", error);
    throw error;
  }
};

export const generatePostQA = async (content: string, question: string): Promise<string> => {
  const ai = getClient();
  try {
    const prompt = `You are a helpful assistant for a blog reader. 
    Answer the user's question based ONLY on the provided article content below.
    If the answer is not found in the article, politely say "I couldn't find the answer in this article."
    Keep your answer concise and friendly.
    
    Article Content:
    ${content.substring(0, 10000)}
    
    User Question:
    ${question}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "I couldn't generate an answer.";
  } catch (error) {
    console.error("Gemini API Error (QA):", error);
    return "Sorry, I encountered an error while analyzing the article.";
  }
};

export const translatePost = async (title: string, content: string, targetLanguage: string): Promise<{ title: string; content: string }> => {
  const ai = getClient();
  try {
    const prompt = `Translate the following blog post title and content into ${targetLanguage}. 
    Ensure you preserve all Markdown formatting (bold, italics, headers, code blocks, lists) exactly as they are in the original.
    The tone should remain professional and consistent with the original text.
    
    Return ONLY a JSON object with the following structure:
    {
      "title": "Translated Title",
      "content": "Translated Markdown Content"
    }
    
    Original Title: ${title}
    
    Original Content:
    ${content.substring(0, 5000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{"title": "", "content": ""}');
  } catch (error) {
    console.error("Gemini API Error (Translate):", error);
    throw error;
  }
};