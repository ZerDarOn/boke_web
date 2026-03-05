import React, { useState, useEffect } from 'react';
import { api, UniverseNode } from '../../lib/api';
import { AlertCircle, Loader2, Plus, RefreshCw, Users, Zap, User } from 'lucide-react';

const AdminUniverse: React.FC = () => {
  const [nodes, setNodes] = useState<UniverseNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'skill' | 'person'>('all');

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.universe.getAll();
      if (result.success && result.data) {
        setNodes(result.data);
      } else {
        setError(result.error || 'Failed to load universe nodes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = nodes.filter(node => {
    if (activeTab === 'all') return node.type !== 'self';
    return node.type === activeTab;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'self': return <User size={16} />;
      case 'skill': return <Zap size={16} />;
      case 'person': return <Users size={16} />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'self': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case 'skill': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'person': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600 dark:text-gray-400">Loading universe nodes...</p>
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
              Universe Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your skills and network connections in one place
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

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <User className="text-emerald-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Center Node</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">1</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Zap className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Skills</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {nodes.filter(n => n.type === 'skill').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Network</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {nodes.filter(n => n.type === 'person').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-white/10">
          {[
            { key: 'all', label: 'All Nodes', count: nodes.filter(n => n.type !== 'self').length },
            { key: 'skill', label: 'Skills', count: nodes.filter(n => n.type === 'skill').length },
            { key: 'person', label: 'Network', count: nodes.filter(n => n.type === 'person').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Nodes List */}
        {filteredNodes.length === 0 ? (
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🌌</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Nodes Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by adding your first node.
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/admin/skills"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Add Skill
              </a>
              <a
                href="/admin/network"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} />
                Add Person
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Node</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Details</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Connections</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Position</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {filteredNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(node.type)}`}>
                          {getTypeIcon(node.type)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{node.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getTypeColor(node.type)}`}>
                        {getTypeIcon(node.type)}
                        {node.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {node.type === 'skill' && (
                        <span>{node.category} • Lv.{node.level}</span>
                      )}
                      {node.type === 'person' && (
                        <span>{node.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {node.connections.length} connections
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      ({Math.round(node.x)}, {Math.round(node.y)})
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={node.type === 'skill' ? '/admin/skills' : '/admin/network'}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Manage →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-6 flex gap-4">
          <a
            href="/admin/skills"
            className="flex-1 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-1">Manage Skills</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">Edit skill nodes and their connections</p>
          </a>
          <a
            href="/admin/network"
            className="flex-1 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <h3 className="font-bold text-purple-900 dark:text-purple-400 mb-1">Manage Network</h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">Edit person nodes and their connections</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminUniverse;
