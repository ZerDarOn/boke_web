import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  type?: 'website' | 'article';
  image?: string;
}

const BASE_TITLE = 'INK.SPIRIT';
const DEFAULT_TITLE = `${BASE_TITLE} | Cyber-Ink Evolution`;
const DEFAULT_DESCRIPTION = 'INK.SPIRIT - 一个融合水墨美学与赛博朋克风格的个人博客，记录技术、作品与生活。';

/**
 * SEO 组件 - 动态更新页面 meta 信息
 * 使用原生 document API，无需额外依赖
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  type = 'website',
  image,
}) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${BASE_TITLE}` : DEFAULT_TITLE;
    const resolvedDescription = description || DEFAULT_DESCRIPTION;
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    const absoluteImage = resolveAbsoluteUrl(image);
    
    // 更新标题
    document.title = fullTitle;
    
    // 更新或创建 meta description
    updateMetaTag('description', resolvedDescription);
    
    // 更新或创建 meta keywords
    updateOptionalMetaTag('keywords', keywords);
    
    // 更新 Open Graph 标签
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:description', resolvedDescription, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateOptionalMetaTag('og:image', absoluteImage, true);
    
    // 更新 Twitter Card 标签
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', resolvedDescription);
    updateOptionalMetaTag('twitter:image', absoluteImage);
    updateCanonicalLink(canonicalUrl);
  }, [title, description, keywords, type, image]);
  
  return null;
};

/**
 * 更新或创建 meta 标签
 */
function updateMetaTag(name: string, content: string, isProperty: boolean = false): void {
  const selector = isProperty 
    ? `meta[property="${name}"]` 
    : `meta[name="${name}"]`;
  
  let meta = document.querySelector(selector) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    if (isProperty) {
      meta.setAttribute('property', name);
    } else {
      meta.setAttribute('name', name);
    }
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
}

function updateOptionalMetaTag(name: string, content?: string, isProperty = false): void {
  const attribute = isProperty ? 'property' : 'name';
  const selector = `meta[${attribute}="${name}"]`;

  if (!content) {
    document.querySelector(selector)?.remove();
    return;
  }

  updateMetaTag(name, content, isProperty);
}

function updateCanonicalLink(href: string): void {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }

  canonical.href = href;
}

function resolveAbsoluteUrl(value?: string): string | undefined {
  if (!value) return undefined;

  try {
    return new URL(value, window.location.origin).href;
  } catch {
    return undefined;
  }
}

export default SEO;
