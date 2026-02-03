import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { 
  Users, 
  BarChart3, 
  Coins, 
  FolderKanban,
  Edit2,
  RotateCcw,
  UserX,
  UserCheck,
  Save,
  X
} from 'lucide-react';

interface UserStats {
  id: string;
  email: string;
  name: string;
  role: string | null;
  is_active: boolean;
  token_limit: number;
  tokens_used: number;
  projects_count: number;
  created_at: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState<number>(25000);

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminApi.getUsers,
  });

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
  });

  const updateLimitMutation = useMutation({
    mutationFn: ({ userId, limit }: { userId: string; limit: number }) =>
      adminApi.updateUserLimit(userId, limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setEditingUser(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminApi.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const resetTokensMutation = useMutation({
    mutationFn: (userId: string) => adminApi.resetUserTokens(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const handleEditLimit = (user: UserStats) => {
    setEditingUser(user.id);
    setNewLimit(user.token_limit);
  };

  const handleSaveLimit = (userId: string) => {
    updateLimitMutation.mutate({ userId, limit: newLimit });
  };

  if (usersError) {
    const errorDetail = (usersError as any)?.response?.data?.detail;
    if (errorDetail === 'Admin access required') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-500">You need admin privileges to access this panel.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-500">Error loading admin data</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage users and view platform statistics</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FolderKanban className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total_projects}</p>
                <p className="text-sm text-gray-500">Total Projects</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Coins className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.total_tokens_used)}</p>
                <p className="text-sm text-gray-500">Total Tokens Used</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Users & Token Usage
            </h2>
          </div>
          
          {usersLoading ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">User</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Projects</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Tokens Used</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Limit</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Usage %</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Registered</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(users as UserStats[])?.map((user) => {
                    const usagePercent = user.token_limit > 0 
                      ? Math.round((user.tokens_used / user.token_limit) * 100) 
                      : 0;
                    const isEditing = editingUser === user.id;
                    
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 ${!user.is_active ? 'opacity-50' : ''}`}>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="p-4 text-gray-700">{user.projects_count}</td>
                        <td className="p-4 text-gray-700">{formatNumber(user.tokens_used)}</td>
                        <td className="p-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={newLimit}
                                onChange={(e) => setNewLimit(Number(e.target.value))}
                                className="w-24 px-2 py-1 border rounded text-sm"
                              />
                              <button
                                onClick={() => handleSaveLimit(user.id)}
                                className="p-1 text-green-600 hover:text-green-700"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-700">{formatNumber(user.token_limit)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  usagePercent >= 90 ? 'bg-red-500' : 
                                  usagePercent >= 70 ? 'bg-amber-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{usagePercent}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditLimit(user)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit limit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => resetTokensMutation.mutate(user.id)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                              title="Reset tokens"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => updateStatusMutation.mutate({ 
                                  userId: user.id, 
                                  isActive: !user.is_active 
                                })}
                                className={`p-1.5 rounded ${
                                  user.is_active 
                                    ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                                title={user.is_active ? 'Disable user' : 'Enable user'}
                              >
                                {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
