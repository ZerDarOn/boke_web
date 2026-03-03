import React, { useState, useEffect } from 'react';
import { api, NetworkNode } from '../../lib/api';
import VisualEditor from '../../components/VisualEditor';
import { AlertCircle, Loader2, Plus, RefreshCw } from 'lucide-react';

const AdminNetwork: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.network.getAll();
      if (result.success && result.data) {
        setNodes(result.data);
      } else {
        setError(result.error || 'Failed to load network nodes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = async (data: Partial<NetworkNode>) => {
    if (isAdding) return;

    try {
      setIsAdding(true);
      setError(null);

      const newNodeData = {
        name: data.label || 'New Node',
        role: data.role || 'Collaborator',
        description: data.description || '',
        x: data.x || 50,
        y: data.y || 50,
        type: data.type || 'minor',
        connections: data.connections || [],
      };

      const result = await api.network.create(newNodeData);
      if (result.success && result.data) {
        await loadNodes();
        alert('节点添加成功！');
      } else {
        setError(result.error || 'Failed to create node');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert('添加失败，请重试');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateNode = async (id: string, updates: Partial<NetworkNode>) => {
    try {
      setError(null);

      const result = await api.network.update(id, updates);
      if (result.success) {
        await loadNodes();
      } else {
        setError(result.error || 'Failed to update node');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDeleteNode = async (id: string) => {
    try {
      setError(null);

      const result = await api.network.delete(id);
      if (result.success) {
        await loadNodes();
        alert('节点删除成功！');
      } else {
        setError(result.error || 'Failed to delete node');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert('删除失败，请重试');
    }
  };

  const handleSaveAll = async (updatedNodes: NetworkNode[]) => {
    try {
      setSaving(true);
      setError(null);

      // 保存所有节点位置
      for (const node of updatedNodes) {
        const result = await api.network.update(node.id, {
          x: node.x,
          y: node.y,
        });
        if (!result.success) {
          throw new Error(`Failed to update node ${node.id}`);
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

  const handleNodeClick = (node: NetworkNode) => {
    console.log('Node clicked:', node);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600 dark:text-gray-400">Loading network nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Network Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your relationship network nodes and connections
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadNodes}
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
        {nodes.length === 0 && (
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🕸️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Network Nodes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by adding your first relationship node.
            </p>
            <button
              onClick={() => handleAddNode({ label: 'New Node' })}
              disabled={isAdding}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              {isAdding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Add First Node
            </button>
          </div>
        )}

        {/* Visual Editor */}
        {nodes.length > 0 && (
          <VisualEditor
            type="network"
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
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-2">
            💡 Tips
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Drag nodes to rearrange their positions</li>
            <li>• Click on a node to view details</li>
            <li>• Use the edit button to change node information</li>
            <li>• Click "Auto Layout" to arrange nodes in a circle</li>
            <li>• Save all positions to persist changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminNetwork;
