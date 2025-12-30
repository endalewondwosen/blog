import React from 'react';
import { Helmet } from 'react-helmet-async';

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
  image, 
  type = 'website',
  url
}) => {
  const siteTitle = "MyBlog";
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  const currentUrl = url || window.location.href;
  const defaultImage = "https://picsum.photos/1200/630?random=seo"; // Placeholder for default social image

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
};

export default SEO;