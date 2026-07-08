import React from 'react';
import { SEO } from '../components/SEO';
import { useSiteConfig } from '../hooks/useSiteConfig';
import Archives from '../components/Archives';
import ShadowFragments from '../components/ShadowFragments';
import Arsenal from '../components/Arsenal';
import Profile from '../components/Profile';

const Home: React.FC = () => {
  const config = useSiteConfig();

  return (
    <>
      <SEO
        title="首页"
        description={config.siteDescription || '个人博客，记录技术与生活'}
      />
      <Archives />
      <ShadowFragments />
      <Arsenal />
      <Profile />
    </>
  );
};

export default Home;
