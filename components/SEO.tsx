import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: string;
  url?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "A modern, AI-enhanced blogging platform powered by Gemini.",
}) => {
  useEffect(() => {
    const siteTitle = "MyBlog";
    document.title = title === siteTitle ? title : `${title} | ${siteTitle}`;
    
    // Update description meta tag manually
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
  }, [title, description]);

  return null;
};

export default SEO;