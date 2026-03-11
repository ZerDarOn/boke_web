import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * 基础骨架屏组件
 * 用于在内容加载时显示占位符
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

/**
 * 文章卡片骨架屏
 */
export const PostCardSkeleton: React.FC<{ viewMode?: 'list' | 'grid' }> = ({ 
  viewMode = 'list' 
}) => {
  if (viewMode === 'grid') {
    return (
      <div className="flex flex-col p-6 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 rounded-lg">
        <Skeleton className="mb-4" height={16} width="40%" />
        <Skeleton className="mb-3" height={28} width="90%" />
        <Skeleton className="mb-2" height={16} width="100%" />
        <Skeleton className="mb-2" height={16} width="80%" />
        <Skeleton className="mt-auto" height={14} width="30%" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start p-6 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 rounded-lg">
      {/* Date Badge */}
      <div className="flex-shrink-0 md:w-28 pt-1">
        <Skeleton className="mb-1" height={16} width="60%" />
        <Skeleton height={20} width="50%" />
      </div>

      {/* Content Card */}
      <div className="flex-1 flex flex-col h-full">
        <Skeleton className="mb-3" height={28} width="70%" />
        <Skeleton className="mb-2" height={16} width="100%" />
        <Skeleton className="mb-4" height={16} width="90%" />
        <Skeleton height={14} width="20%" />
      </div>
    </div>
  );
};

/**
 * 文章列表骨架屏
 */
export const PostListSkeleton: React.FC<{ 
  count?: number; 
  viewMode?: 'list' | 'grid' 
}> = ({ 
  count = 5, 
  viewMode = 'list' 
}) => {
  return (
    <div className={viewMode === 'list' ? 'grid grid-cols-1 gap-12' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  );
};

/**
 * 项目卡片骨架屏
 */
export const ProjectCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col p-6 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton className="mb-1" height={20} width="60%" />
          <Skeleton height={14} width="40%" />
        </div>
      </div>
      <Skeleton className="mb-2" height={14} width="100%" />
      <Skeleton className="mb-4" height={14} width="80%" />
      <div className="flex gap-2">
        <Skeleton height={24} width={60} />
        <Skeleton height={24} width={80} />
        <Skeleton height={24} width={50} />
      </div>
    </div>
  );
};

/**
 * 详情页骨架屏
 */
export const DetailPageSkeleton: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500">
      {/* 标题 */}
      <Skeleton className="mb-4" height={48} width="80%" />
      
      {/* 元信息 */}
      <div className="flex gap-6 mb-8">
        <Skeleton height={20} width={100} />
        <Skeleton height={20} width={80} />
        <Skeleton height={20} width={60} />
      </div>
      
      {/* 摘要 */}
      <div className="mb-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <Skeleton height={16} width="100%" className="mb-2" />
        <Skeleton height={16} width="90%" className="mb-2" />
        <Skeleton height={16} width="70%" />
      </div>
      
      {/* 内容 */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton height={16} width="100%" className="mb-2" />
            <Skeleton height={16} width="95%" className="mb-2" />
            <Skeleton height={16} width="85%" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
