// Note: Prisma instance is passed or imported from the initialized module
// This service assumes the database is already initialized
import prisma from '../lib/prisma';

// Fallback: if prisma fails due to schema mismatch, we'll handle it gracefully

export interface UniverseNode {
  id: string;
  name: string;
  type: 'self' | 'skill' | 'person';
  x: number;
  y: number;
  nodeType?: 'core' | 'major' | 'minor';
  connections: string[];
  // 技能特有
  category?: string;
  level?: number;
  rank?: string;
  image?: string;
  // 人脉特有
  role?: string;
  description?: string;
  avatar?: string;
  // 按钮配置
  buttonEnabled?: boolean;
  buttonLabel?: string;
  buttonLink?: string;
}

export class UniverseService {
  // 获取完整的宇宙图 - 支持不同模式的坐标系统
  // mode: 'all' = 宇宙图专用坐标, 'skill' = 技能表坐标, 'person' = 人脉表坐标
  static async getUniverse(mode: 'all' | 'skill' | 'person' = 'all'): Promise<UniverseNode[]> {
    // 1. 获取所有技能节点
    const skills = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        nodeType: true,
        connections: true,
        category: true,
        level: true,
        rank: true,
        nodeX: true,
        nodeY: true,
        image: true,
        buttonEnabled: true,
        buttonLabel: true,
        buttonLink: true,
      },
    });

    // 2. 获取人脉节点
    const persons = await prisma.networkNode.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        connections: true,
        role: true,
        description: true,
        avatar: true,
        x: true,
        y: true,
        buttonEnabled: true,
        buttonLabel: true,
        buttonLink: true,
      },
    });

    // 3. 根据模式获取坐标
    let universeLayoutMap: Map<string, { x: number; y: number }> = new Map();
    if (mode === 'all') {
      try {
        // 使用 Prisma 标准方法查询宇宙图布局
        const layouts = await prisma.universeLayout.findMany();
        universeLayoutMap = new Map(layouts.map(l => [l.nodeId, { x: l.x, y: l.y }]));
      } catch (error) {
        console.error('Failed to fetch universe layouts:', error);
        // 如果失败，使用空 Map，节点会使用默认位置
      }
    }

    // 4. 转换为统一格式，根据模式使用不同坐标
    const skillNodes: UniverseNode[] = skills.map(skill => {
      let x: number, y: number;
      
      if (mode === 'all') {
        // 全部模式：使用宇宙图专用坐标
        const layout = universeLayoutMap.get(`skill_${skill.id}`);
        x = layout?.x ?? 50;
        y = layout?.y ?? 50;
      } else if (mode === 'skill') {
        // 技能模式：使用技能表坐标
        x = skill.nodeX ?? 50;
        y = skill.nodeY ?? 50;
      } else {
        // 人脉模式：技能节点使用默认位置
        x = 50;
        y = 50;
      }

      return {
        id: `skill_${skill.id}`,
        name: skill.name,
        type: 'skill',
        x,
        y,
        nodeType: skill.nodeType || 'minor',
        connections: (skill.connections || []).map((id: string) => `skill_${id}`),
        category: skill.category,
        level: skill.level,
        rank: skill.rank,
        image: skill.image,
        buttonEnabled: skill.buttonEnabled,
        buttonLabel: skill.buttonLabel,
        buttonLink: skill.buttonLink,
      };
    });

    const personNodes: UniverseNode[] = persons.map(person => {
      let x: number, y: number;
      
      if (mode === 'all') {
        // 全部模式：使用宇宙图专用坐标
        const layout = universeLayoutMap.get(`person_${person.id}`);
        x = layout?.x ?? 50;
        y = layout?.y ?? 50;
      } else if (mode === 'person') {
        // 人脉模式：使用人脉表坐标
        x = person.x ?? 50;
        y = person.y ?? 50;
      } else {
        // 技能模式：人脉节点使用默认位置
        x = 50;
        y = 50;
      }

      return {
        id: `person_${person.id}`,
        name: person.name,
        type: 'person',
        x,
        y,
        nodeType: person.type || 'major',
        connections: (person.connections || []).map((id: string) => `person_${id}`),
        role: person.role,
        description: person.description,
        avatar: person.avatar,
        buttonEnabled: person.buttonEnabled,
        buttonLabel: person.buttonLabel,
        buttonLink: person.buttonLink,
      };
    });

    // 5. 添加中心节点（你自己）
    const selfNode: UniverseNode = {
      id: 'self',
      name: 'CyberRonin',
      type: 'self',
      x: 50,
      y: 50,
      nodeType: 'core',
      connections: [],
      role: 'Fullstack Alchemist',
      description: 'The Architect of this digital realm.',
    };

    return [selfNode, ...skillNodes, ...personNodes];
  }

  // 更新宇宙图布局（全部模式专用坐标）
  static async updateLayout(nodeId: string, nodeType: 'skill' | 'person', x: number, y: number) {
    try {
      // 使用 Prisma upsert 操作
      await prisma.universeLayout.upsert({
        where: { nodeId },
        create: {
          nodeId,
          nodeType,
          x,
          y,
        },
        update: {
          x,
          y,
        },
      });
      console.log(`Saved layout for ${nodeId}: (${x}, ${y})`);
    } catch (error) {
      console.error('Failed to save universe layout:', error);
      throw error; // 抛出错误让调用方知道保存失败
    }
    
    return { nodeId, nodeType, x, y };
  }

  // 获取连接关系
  static async getConnections() {
    const nodes = await this.getUniverse();
    const connections: { source: string; target: string }[] = [];

    nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        // 避免重复连接
        const exists = connections.some(
          (c) =>
            (c.source === node.id && c.target === targetId) ||
            (c.source === targetId && c.target === node.id)
        );

        if (!exists) {
          connections.push({ source: node.id, target: targetId });
        }
      });
    });

    return connections;
  }
}
