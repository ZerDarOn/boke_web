import React from 'react';
import PageProjects from '../components/PageProjects';
import { SEO } from '../components/SEO';
import SectionHeading from '../components/SectionHeading';

const Projects: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <SEO title="项目" description="正在维护、已经交付和留在归档里的作品" type="website" />
      <SectionHeading
        index="P.02"
        eyebrow="Project index / 项目档案"
        level="h1"
        title="把想法做成可运行的东西"
        description="这里记录作品的现状，也保留它们一路留下的技术选择与取舍。"
      />
      <PageProjects />
    </div>
  );
};

export default Projects;
