import os
from pathlib import Path

def create_ink_world():
    # 定义墨色武侠博客的骨架结构
    structure = [
        # 前端部分 - Next.js 结构
        "frontend/public/assets/fonts",      # 存放书法字体
        "frontend/public/assets/images",     # 存放宣纸纹理、墨水素材
        "frontend/src/app/(intro)",          # 开场动画逻辑
        "frontend/src/app/blog",             # 博客文章页
        "frontend/src/components/ui",        # 基础组件（如水墨按钮）
        "frontend/src/components/effects",   # 特效组件（如墨滴扩散）
        "frontend/src/components/shared",    # 通用组件（导航栏、页脚）
        "frontend/src/styles",               # 全局样式
        "frontend/src/lib",                  # 工具类
        
        # 后端部分 - FastAPI 结构
        "backend/app/api/endpoints",         # API 路由
        "backend/app/core",                  # 核心配置
        "backend/app/models",                # 数据库模型
        "backend/app/schemas",               # 数据验证 Pydantic 模型
        
        # 其它
        "docs/design",                       # 设计手稿
        "docs/logs",                         # 开发日志
    ]

    print("📜 正在为你开启墨色武侠世界...")

    for folder in structure:
        Path(folder).mkdir(parents=True, exist_ok=True)
        # 在每个空文件夹下创建一个 .gitkeep，防止 Git 忽略空目录
        with open(Path(folder) / ".gitkeep", "w") as f:
            pass
        print(f"✅ 已创建路径: {folder}")

    # 创建一些初始化的说明文件
    with open("README.md", "w", encoding="utf-8") as f:
        f.write("# Ink-Spirit-Blog\n\n墨色武侠风个人全栈博客。")

    print("\n✨ 基础架构搭建完毕！你可以删除 init_sect.py 脚本了。")

if __name__ == "__main__":
    create_ink_world()