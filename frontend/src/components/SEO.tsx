import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  type?: 'website' | 'article';
  image?: string;
}

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
    const baseTitle = 'INK.SPIRIT';
    const fullTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} | Cyber-Ink Evolution`;
    
    // 更新标题
    document.title = fullTitle;
    
    // 更新或创建 meta description
    updateMetaTag('description', description || 'INK.SPIRIT - 一个融合水墨美学与赛博朋克风格的个人博客，分享技术文章、项目经历、追番记录和生活点滴。');
    
    // 更新或创建 meta keywords
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }
    
    // 更新 Open Graph 标签
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:type', type, true);
    if (description) {
      updateMetaTag('og:description', description, true);
    }
    if (image) {
      updateMetaTag('og:image', image, true);
    }
    
    // 更新 Twitter Card 标签
    updateMetaTag('twitter:title', fullTitle);
    if (description) {
      updateMetaTag('twitter:description', description);
    }
    if (image) {
      updateMetaTag('twitter:image', image);
    }
    
    // 清理函数 - 恢复默认标题
    return () => {
      document.title = 'INK.SPIRIT | Cyber-Ink Evolution';
    };
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

export default SEO;
