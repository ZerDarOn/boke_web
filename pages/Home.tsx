import React from 'react';
import Archives from '../components/Archives';
import ShadowFragments from '../components/ShadowFragments';
import Arsenal from '../components/Arsenal';
import Profile from '../components/Profile';

const Home: React.FC = () => {
  return (
    <>
      <Archives />
      <ShadowFragments />
      <Arsenal />
      <Profile />
    </>
  );
};

export default Home;
