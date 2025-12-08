import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
}

export function SEO({
  title = 'Blozhik - Modern Blogging Platform',
  description = 'Create, share, and discover amazing content on Blozhik',
  keywords = ['blog', 'blogging', 'writing', 'content'],
  image = '/og-image.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  author,
  publishedTime,
}: SEOProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper to set or update meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords.join(', '));

    // Open Graph tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:url', url, true);
    setMetaTag('og:image', image, true);
    setMetaTag('og:site_name', 'Blozhik', true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);

    // Article specific tags
    if (type === 'article') {
      if (author) setMetaTag('article:author', author, true);
      if (publishedTime) setMetaTag('article:published_time', publishedTime, true);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, keywords, image, url, type, author, publishedTime]);

  return null;
}
