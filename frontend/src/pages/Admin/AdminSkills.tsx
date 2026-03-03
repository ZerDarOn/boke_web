import React, { useState, useEffect } from 'react';
import { api, Skill } from '../../lib/api';
import VisualEditor from '../../components/VisualEditor';
import { AlertCircle, Loader2, Plus, RefreshCw } from 'lucide-react';

interface SkillNode {
  id: string;
  label: string;
  x: number;
  y: number;
  connections: string[];
  type: 'core' | 'major' | 'minor';
  level?: number;
}

const AdminSkills: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.skills.getAll();
      if (result.success && result.data) {
        setSkills(result.data);
      } else {
        setError(result.error || 'Failed to load skills');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const transformSkillsToNodes = (): SkillNode[] => {
    return skills.map(skill => ({
      id: skill.id,
      label: skill.name,
      x: skill.nodeX || 50,
      y: skill.nodeY || 50,
      connections: skill.connections || [],
      type: skill.nodeType || 'minor',
      level: skill.level || 1,
    }));
  };

  const handleAddNode = async (data: Partial<SkillNode>) => {
    if (isAdding) return;

    try {
      setIsAdding(true);
      setError(null);

      const newSkillData = {
        name: data.label || 'New Skill',
        category: 'GENERAL',
        level: data.level || 1,
        rank: 'Novice',
        projectCount: 0,
        nodeX: data.x || 50,
        nodeY: data.y || 50,
        nodeType: data.type || 'minor',
        connections: data.connections || [],
      };

      const result = await api.skills.create(newSkillData);
      if (result.success && result.data) {
        await loadSkills();
        alert('技能添加成功！');
      } else {
        setError(result.error || 'Failed to create skill');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert('添加失败，请重试');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateNode = async (id: string, updates: Partial<SkillNode>) => {
    try {
      setError(null);

      const skillUpdates: Partial<Skill> = {
        name: updates.label,
        nodeX: updates.x,
        nodeY: updates.y,
        nodeType: updates.type,
        level: updates.level,
        connections: updates.connections,
      };

      const result = await api.skills.update(id, skillUpdates);
      if (result.success) {
        await loadSkills();
      } else {
        setError(result.error || 'Failed to update skill');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDeleteNode = async (id: string) => {
    try {
      setError(null);

      const result = await api.skills.delete(id);
      if (result.success) {
        await loadSkills();
        alert('技能删除成功！');
      } else {
        setError(result.error || 'Failed to delete skill');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert('删除失败，请重试');
    }
  };

  const handleSaveAll = async (updatedNodes: SkillNode[]) => {
    try {
      setSaving(true);
      setError(null);

      // 保存所有技能位置
      for (const node of updatedNodes) {
        const result = await api.skills.update(node.id, {
          nodeX: node.x,
          nodeY: node.y,
        });
        if (!result.success) {
          throw new Error(`Failed to update skill ${node.id}`);
        }
      }

      alert('所有位置保存成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleNodeClick = (node: SkillNode) => {
    console.log('Skill clicked:', node);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600 dark:text-gray-400">Loading skills...</p>
        </div>
      </div>
    );
  }

  const nodes = transformSkillsToNodes();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Skills Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your skills and their relationships
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadSkills}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle size={20} />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {/* Empty State */}
        {skills.length === 0 && (
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">⚔️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Skills
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by adding your first skill.
            </p>
            <button
              onClick={() => handleAddNode({ label: 'New Skill' })}
              disabled={isAdding}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              {isAdding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Add First Skill
            </button>
          </div>
        )}

        {/* Visual Editor */}
        {skills.length > 0 && (
          <VisualEditor
            type="skills"
            nodes={nodes}
            onSave={handleSaveAll}
            onAddNode={handleAddNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onNodeClick={handleNodeClick}
            editable={true}
          />
        )}

        {/* Info Panel */}
        <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="font-bold text-green-900 dark:text-green-400 mb-2">
            💡 Tips
          </h3>
          <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
            <li>• Drag skills to rearrange their positions</li>
            <li>• Click on a skill to view details</li>
            <li>• Use the edit button to change skill information</li>
            <li>• Adjust skill levels (1-5) to indicate proficiency</li>
            <li>• Click "Auto Layout" to arrange skills in a circle</li>
            <li>• Save all positions to persist changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSkills;
