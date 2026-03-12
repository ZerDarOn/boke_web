/**
 * 共享枚举类型定义
 * 前后端共用，确保数据一致性
 */

// ============ 项目状态 ============
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'DEPLOYED';

// ============ 动漫相关 ============
export type AnimeStatus = 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
export type AnimeType = 'TV' | 'OVA' | 'Movie' | 'Special' | 'ONA';

// ============ 日记心情/天气 ============
export type DiaryMood = '😊' | '🌙' | '☔' | '🌸' | '⚡';
export type DiaryWeather = '☀️' | '☁️' | '🌧️' | '⛈️' | '❄️';
export type DiaryType = 'SHORT' | 'LONG';

// ============ 时间线事件类型 ============
export type TimelineEventType = 'MILESTONE' | 'JOB' | 'LIFE';

// ============ 技能等级 ============
export type SkillRank = 'Master' | 'Expert' | 'Adept' | 'Novice';
export type SkillNodeType = 'core' | 'major' | 'minor';

// ============ 图片相关 ============
export type ImageAspect = 'portrait' | 'landscape' | 'square';

// ============ 公告类型 ============
export type AnnouncementType = 'INFO' | 'WARNING' | 'SUCCESS' | 'IMPORTANT';

// ============ 文件类型 ============
export type FileType = 'folder' | 'markdown' | 'binary';

// ============ 访问级别 ============
export type AccessLevel = 'PUBLIC' | 'PRIVATE' | 'PASSWORD';

// ============ 历史项目图标 ============
export type HistoryIcon = 'FileText' | 'Briefcase' | 'Code' | 'Star' | 'Trophy' | 'Globe' | 'Zap' | 'Heart';
