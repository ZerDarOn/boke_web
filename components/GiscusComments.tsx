import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface GiscusCommentsProps {
  theme?: 'light' | 'dark' | 'preferred_color_scheme';
}

const GiscusComments: React.FC<GiscusCommentsProps> = ({ theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    const attributes = {
      'data-repo': 'YOUR_GITHUB_USERNAME/YOUR_REPO_NAME',
      'data-repo-id': 'YOUR_REPO_ID',
      'data-category': 'Announcements',
      'data-category-id': 'YOUR_CATEGORY_ID',
      'data-mapping': 'pathname',
      'data-strict': '1',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '1',
      'data-input-position': 'bottom',
      'data-theme': theme,
      'data-lang': 'zh-CN',
    };

    Object.entries(attributes).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [location.pathname, theme]);

  return <div ref={containerRef} className="w-full mt-12" />;
};

export default GiscusComments;