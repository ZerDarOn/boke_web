import React, { useState } from 'react';

interface SimpleAdminPageProps {
  title: string;
  icon: string;
  description: string;
  features: string[];
}

const SimpleAdminPage: React.FC<SimpleAdminPageProps> = ({ title, icon, description, features }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-paper flex items-center gap-3">
            <span>{icon}</span>
            <span>{title}</span>
          </h1>
          <p className="text-ink/70 dark:text-gray-400 mt-2">{description}</p>
        </div>
        <button className="px-6 py-2 bg-ink text-white dark:text-black rounded-lg hover:bg-ink/80 dark:hover:bg-ink/80 transition-colors">
          + 新增
        </button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <div key={index} className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700 shadow-sm">
            <div className="text-2xl mb-3">{feature}</div>
            <p className="text-ink/70 dark:text-gray-400">该功能开发中...</p>
          </div>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="bg-ink/5 dark:bg-black/20 rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">🚧</div>
        <p className="text-xl font-medium text-ink dark:text-paper">
          完整管理功能开发中...
        </p>
        <p className="mt-4 text-ink/70 dark:text-gray-400">
          当前可以查看仪表盘数据，更多管理功能即将上线。
        </p>
      </div>
    </div>
  );
};

const AdminProjects: React.FC = () => (
  <SimpleAdminPage
    title="项目管理"
    icon="🚀"
    description="管理所有项目，包括技术栈、链接和部署状态"
    features={[
      '创建新项目',
      '编辑项目信息',
      '上传封面图',
      '添加 GitHub 集成',
      '查看项目统计',
      '管理项目状态',
      '批量删除',
      '导入/导出',
    ]}
  />
);

const AdminAnime: React.FC = () => (
  <SimpleAdminPage
    title="动漫管理"
    icon="🎬"
    description="追踪和管理动漫观看进度、评分和笔记"
    features={[
      '添加新动漫',
      '更新观看进度',
      '评分和收藏',
      '查看观看历史',
      '搜索动漫库',
      '批量导入',
      '导出观看数据',
    ]}
  />
);

const AdminGallery: React.FC = () => (
  <SimpleAdminPage
    title="相册管理"
    icon="📷"
    description="管理相册和照片，支持批量操作和 EXIF 信息查看"
    features={[
      '创建新相册',
      '批量上传照片',
      '编辑照片信息',
      '管理照片标签',
      '查看照片统计',
      '设置封面图',
      '删除/移动照片',
    ]}
  />
);

const AdminDiary: React.FC = () => (
  <SimpleAdminPage
    title="日记管理"
    icon="📔"
    description="管理便签和长文日记，支持 Markdown 编辑"
    features={[
      '创建新日记',
      '切换日记类型',
      '编辑日记内容',
      '查看日记列表',
      '搜索日记',
      '导出日记',
    ]}
  />
);

const AdminSkills: React.FC = () => (
  <SimpleAdminPage
    title="技能管理"
    icon="⚔️"
    description="管理技能矩阵，包括等级、项目和可视化节点"
    features={[
      '添加新技能',
      '更新技能等级',
      '管理技能分类',
      '设置节点位置',
      '配置连接关系',
      '同步项目数据',
    ]}
  />
);

const AdminTimeline: React.FC = () => (
  <SimpleAdminPage
    title="时间线管理"
    icon="📅"
    description="管理时间线事件，包括里程碑、工作和生活事件"
    features={[
      '添加新事件',
      '编辑事件信息',
      '调整时间线顺序',
      '关联项目',
      '设置事件类型',
      '导入/导出',
    ]}
  />
);

const AdminNetwork: React.FC = () => (
  <SimpleAdminPage
    title="网络管理"
    icon="🕸️"
    description="管理关系网络节点，可视化人脉和合作网络"
    features={[
      '添加新节点',
      '编辑节点信息',
      '配置节点位置',
      '管理连接关系',
      '设置节点类型',
      '导入/导出网络',
    ]}
  />
);

const AdminAnnouncements: React.FC = () => (
  <SimpleAdminPage
    title="公告管理"
    icon="📢"
    description="管理系统公告，支持多种类型和附件"
    features={[
      '创建新公告',
      '编辑公告内容',
      '设置公告类型',
      '上传附件',
      '发布/取消发布',
      '置顶公告',
      '定时发布',
    ]}
  />
);

const AdminUsers: React.FC = () => (
  <SimpleAdminPage
    title="用户管理"
    icon="👥"
    description="管理系统用户，包括权限、角色和状态"
    features={[
      '创建新用户',
      '编辑用户信息',
      '设置用户角色',
      '重置用户密码',
      '启用/禁用账号',
      '查看用户日志',
      '批量导入用户',
    ]}
  />
);

const AdminSettings: React.FC = () => (
  <SimpleAdminPage
    title="系统设置"
    icon="⚙️"
    description="配置系统全局参数和功能开关"
    features={[
      '网站基本信息',
      'SEO 设置',
      '评论设置',
      '上传限制',
      '缓存配置',
      '备份设置',
      '日志查看',
    ]}
  />
);

export {
  AdminProjects,
  AdminAnime,
  AdminGallery,
  AdminDiary,
  AdminSkills,
  AdminTimeline,
  AdminNetwork,
  AdminAnnouncements,
  AdminUsers,
  AdminSettings,
};
