# 仪表盘系统 - 测试清单

## 🧪 功能测试清单

### 一、仪表盘功能测试

#### 1. 系统状态模块
- [ ] 运行时间显示正确（格式：Xd XXh XXm）
- [ ] 数据库连接状态显示（Stable）
- [ ] 存储使用率显示（基于内容数量）
- [ ] 存储进度条动画正常

#### 2. 流量统计模块
- [ ] 总请求数显示正确（来自 SiteStats）
- [ ] 访问量显示正确（来自 SiteStats）
- [ ] 柱状图显示（基于真实流量趋势）
- [ ] 柱状图高度正确（相对比例）

#### 3. 内容统计模块
- [ ] 总内容数显示正确（文章+日记+相册+动漫）
- [ ] 文章数量显示正确
- [ ] 照片数量显示正确
- [ ] 日记数量显示正确
- [ ] 图标显示正确（Book, Camera）

#### 4. 互动数据模块
- [ ] 点赞数显示正确（来自文章聚合）
- [ ] 收藏数显示正确（来自动漫表）
- [ ] 评论数显示正确（文章+相册）

#### 5. 内容分布模块
- [ ] 圆环图显示正确（4 个扇区）
- [ ] 角度根据百分比正确计算
- [ ] 图例显示数量和百分比
- [ ] 颜色分配正确（neon, pink, amber, purple）

#### 6. 评论统计模块
- [ ] 圆环图显示正确（3 个扇区）
- [ ] 角度根据百分比正确计算
- [ ] 图例显示数量和百分比
- [ ] 颜色分配正确（neon, pink, amber）

#### 7. 热门内容模块
- [ ] 显示 Top 5 文章
- [ ] 排序正确（浏览量降序，点赞数降序）
- [ ] 显示文章标题和分类
- [ ] 显示浏览量
- [ ] 悬停效果正常

#### 8. 特色项目模块
- [ ] 显示 Top 3 项目
- [ ] 显示项目名称
- [ ] 显示项目状态
- [ ] 无项目时显示提示

#### 9. 维护模式入口
- [ ] 状态显示正确（在线/离线）
- [ ] 图标状态正确（lock, open）
- [ ] 点击跳转到 /maintenance
- [ ] 颜色状态正确

#### 10. 刷新功能
- [ ] 刷新按钮显示
- [ ] 点击后重新加载所有数据
- [ ] 加载动画显示
- [ ] 刷新完成后数据更新

---

### 二、维护模式功能测试

#### 11. 登录功能
- [ ] 密码输入框显示
- [ ] 正确密码可以登录（admin123）
- [ ] 错误密码显示错误提示
- [ ] 剩余尝试次数显示（4, 3, 2, 1, 0）
- [ ] 5 次失败后显示锁定提示（15 分钟）
- [ ] 锁定期内无法登录
- [ ] 锁定期过后可以登录

#### 12. 日志查看器
- [ ] 类别选择器工作正常
- [ ] 级别过滤器工作正常
- [ ] 搜索功能正常
- [ ] 刷新功能正常
- [ ] 导出功能正常（JSON 格式）
- [ ] 清空功能正常（保留最近 10 条）

#### 13. 日志显示
- [ ] 时间戳显示正确
- [ ] 级别图标正确（info=check, warn=alert, error=x, debug=terminal）
- [ ] 级别颜色正确（info=blue, warn=yellow, error=red, debug=purple）
- [ ] 消息显示正确
- [ ] 数据对象格式化显示
- [ ] 堆栈跟踪展开/折叠正常

#### 14. Token 管理
- [ ] 登录成功后获取 Token
- [ ] Token 有效期正确（30 分钟）
- [ ] Token 过期后需要重新登录
- [ ] 受保护端点需要有效 Token

---

### 三、API 端点测试

#### 15. 仪表盘 API

```
GET /api/dashboard/stats
```
- [ ] 返回 uptime（字符串格式）
- [ ] 返回 totalRequests（数字）
- [ ] 返回 uniqueVisitors（数字）
- [ ] 返回 contentStats（包含所有字段）
- [ ] 返回 commentDistribution（包含 percentage）
- [ ] 返回 trafficTrend（数组）

```
GET /api/dashboard/popular
```
- [ ] 返回 posts 数组（最多 5 条）
- [ ] 返回 projects 数组（最多 3 条）
- [ ] posts 包含 id, title, category, viewCount
- [ ] projects 包含 id, name, status

```
GET /api/dashboard/content-distribution
```
- [ ] 返回 4 个类别（Articles, Diary, Albums, Anime）
- [ ] 每个类别包含 count 和 percentage
- [ ] 百分比总和为 100

#### 16. 维护模式 API

```
GET /api/maintenance/status
```
- [ ] 返回 enabled（true/false）

```
POST /api/maintenance/login
```
- [ ] 正确密码返回 Token
- [ ] 错误密码返回错误和剩余次数
- [ ] 锁定状态返回错误和锁定时间

```
GET /api/maintenance/verify
```
- [ ] 有效 Token 返回 valid: true
- [ ] 无效 Token 返回 valid: false

```
GET /api/maintenance/logs/maintenance
```
- [ ] 需要 Token
- [ ] 返回 Maintenance 日志
- [ ] 无效 Token 返回 401

```
GET /api/maintenance/logs/system
```
- [ ] 需要 Token
- [ ] 返回 System 日志

```
GET /api/maintenance/logs/api
```
- [ ] 需要 Token
- [ ] 返回 API 日志

```
GET /api/maintenance/logs/database
```
- [ ] 需要 Token
- [ ] 返回 Database 日志

```
GET /api/maintenance/logs/categories
```
- [ ] 需要 Token
- [ ] 返回所有类别

```
GET /api/maintenance/logs/filter?category=System&level=error
```
- [ ] 需要 Token
- [ ] 返回过滤后的日志

```
GET /api/maintenance/logs/search?category=System&query=error
```
- [ ] 需要 Token
- [ ] 返回搜索结果

```
POST /api/maintenance/logs/clear?category=System
```
- [ ] 需要 Token
- [ ] 清空日志（保留最近 10 条）

---

### 四、安全测试

#### 17. 密码保护
- [ ] 未登录无法访问 /maintenance
- [ ] 登录后才能查看日志
- [ ] 无 Token 无法访问保护端点
- [ ] 错误 Token 返回 401

#### 18. 失败限制
- [ ] 5 次失败后锁定 IP
- [ ] 锁定时间 15 分钟
- [ ] 成功登录后清除失败计数
- [ ] 所有登录尝试都记录

#### 19. CORS 配置
- [ ] x-maintenance-token 头在预检响应中允许
- [ ] 跨域请求正常工作

---

### 五、性能测试

#### 20. 响应时间
- [ ] /api/dashboard/stats 响应 < 200ms
- [ ] /api/dashboard/popular 响应 < 200ms
- [ ] /api/dashboard/content-distribution 响应 < 200ms
- [ ] /api/maintenance/login 响应 < 100ms
- [ ] /api/maintenance/logs/* 响应 < 100ms

#### 21. 渲染性能
- [ ] 仪表盘首屏渲染 < 500ms
- [ ] 维护面板首屏渲染 < 500ms
- [ ] 日志列表滚动流畅

---

### 六、响应式测试

#### 22. 移动端（< 768px）
- [ ] 单列布局正常
- [ ] 所有模块可访问
- [ ] 文字大小合适
- [ ] 触摸操作正常

#### 23. 平板（768px - 1024px）
- [ ] 双列布局正常
- [ ] 所有模块可访问
- [ ] 文字大小合适

#### 24. 桌面（> 1024px）
- [ ] 四列布局正常
- [ ] 所有模块可访问
- [ ] 利用屏幕空间

---

### 七、暗黑模式测试

#### 25. 暗黑主题
- [ ] 所有组件在暗黑模式下正常显示
- [ ] 文字对比度足够
- [ ] 边框和背景正确
- [ ] 图标颜色正确

---

### 八、错误处理测试

#### 26. API 错误
- [ ] 网络错误显示友好的提示
- [ ] 服务器错误显示友好的提示
- [ ] 数据解析错误显示友好的提示

#### 27. 用户输入
- [ ] 密码为空时显示错误
- [ ] 密码过长时显示错误
- [ ] 搜索为空时显示所有结果
- [ ] 类别为空时显示提示

---

### 九、日志测试

#### 28. 日志文件
- [ ] logs/ 目录已创建
- [ ] 4 个日志文件已创建（maintenance.log, system.log, api.log, database.log）
- [ ] 日志格式为 JSON
- [ ] 日志自动清理（7 天）

#### 29. 日志内容
- [ ] 时间戳格式正确（ISO 8601）
- [ ] 级别正确（info, warn, error, debug）
- [ ] 类别正确（Maintenance, System, API, Database）
- [ ] 消息内容有意义

---

### 十、兼容性测试

#### 30. 浏览器兼容性
- [ ] Chrome 浏览器正常
- [ ] Firefox 浏览器正常
- [ ] Safari 浏览器正常
- [ ] Edge 浏览器正常

#### 31. 版本兼容性
- [ ] React 19 正常
- [ ] TypeScript 正常
- [ ] Vite 正常

---

## 📋 测试总结

### 已完成测试
- [ ] 所有核心功能已实现
- [ ] 所有 API 端点已实现
- [ ] 所有安全问题已修复
- [ ] 所有类型定义已更新

### 待完成测试
- [ ] 全面功能测试（使用本清单）
- [ ] 性能基准测试
- [ ] 安全渗透测试
- [ ] 浏览器兼容性测试

---

## 🚀 快速测试指南

### 1. 启动测试

```bash
# 启动后端
cd ink-spirit-blog/backend
npm run dev

# 启动前端（新终端）
cd ink-spirit-blog/frontend
npm run dev
```

### 2. 功能测试

```bash
# 1. 测试仪表盘
curl http://localhost:3000/dashboard

# 2. 测试维护模式登录
curl -X POST http://localhost:3001/api/maintenance/login \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'

# 3. 测试仪表盘 API
curl http://localhost:3001/api/dashboard/stats
curl http://localhost:3001/api/dashboard/popular
curl http://localhost:3001/api/dashboard/content-distribution

# 4. 测试维护模式 API
TOKEN="your_token_here"
curl -H "x-maintenance-token: $TOKEN" \
  http://localhost:3001/api/maintenance/logs/maintenance
```

### 3. 验证检查清单

- 使用本清单逐项测试
- 记录测试结果
- 标记问题并报告

---

## 📝 测试记录模板

```
测试日期：YYYY-MM-DD
测试人员：姓名
环境：开发/测试

仪表盘功能测试：
[ ] 系统状态 - 通过/失败
[ ] 流量统计 - 通过/失败
[ ] 内容统计 - 通过/失败
...

维护模式功能测试：
[ ] 登录功能 - 通过/失败
[ ] 日志查看 - 通过/失败
...

API 端点测试：
[ ] /api/dashboard/stats - 通过/失败
[ ] /api/dashboard/popular - 通过/失败
...

问题和建议：
1. ...
2. ...

总体评价：
- 功能完整性：X/10
- 性能表现：X/10
- 安全性：X/10
- 用户体验：X/10
```

---

**使用本清单进行全面测试，确保系统质量！** ✨
