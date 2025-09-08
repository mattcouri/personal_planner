import React, { useState } from 'react';
import { Shield, Plus, Eye, EyeOff, Copy, Search, ExternalLink, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { v4 as uuidv4 } from 'uuid';

export default function Passwords() {
  const { state, dispatch } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<any>(null);

  const filteredPasswords = state.passwords.filter(password =>
    password.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update dummy data to include PIN field
  const passwordsWithPin = filteredPasswords.map(password => ({
    ...password,
    pin: password.pin || (password.id === 'pwd001' ? '1234' : password.id === 'pwd002' ? '5678' : '')
  }));

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleAddPassword = () => {
    setEditingPassword(null);
    setShowAddModal(true);
  };

  const handleEditPassword = (password: any) => {
    setEditingPassword(password);
    setShowAddModal(true);
  };

  const handleDeletePassword = (passwordId: string) => {
    if (confirm('Are you sure you want to delete this password?')) {
      dispatch({ type: 'DELETE_PASSWORD', payload: passwordId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Password Manager
          </h1>
        </div>

        <button 
          onClick={handleAddPassword}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Add Password</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Password List - Compact Design */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Password
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {passwordsWithPin.length > 0 ? (
            passwordsWithPin.map(password => (
              <tr key={password.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-200">
                {/* Account Name */}
                <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {password.name}
                      </h3>
                      {password.url && (
                        <a
                          href={password.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:text-primary-600 transition-colors duration-200 flex-shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {password.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {password.description || password.notes}
                      </p>
                    )}
                </td>

                {/* Username */}
                <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 dark:text-white font-mono truncate">
                        {password.username}
                      </span>
                      <button
                        onClick={() => copyToClipboard(password.username)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 flex-shrink-0"
                        title="Copy username"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                </td>

                {/* Password */}
                <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 dark:text-white font-mono flex-1 truncate">
                        {visiblePasswords.has(password.id) 
                          ? password.password 
                          : '●'.repeat(Math.min(password.password.length, 12))
                        }
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(password.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 flex-shrink-0"
                        title={visiblePasswords.has(password.id) ? "Hide password" : "Show password"}
                      >
                        {visiblePasswords.has(password.id) ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        title="Copy password"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                </td>

                {/* PIN */}
                <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      {password.pin ? (
                        <>
                          <span className="text-sm text-gray-900 dark:text-white font-mono flex-1 truncate">
                            {visiblePasswords.has(password.id + '-pin') 
                              ? password.pin 
                              : '●'.repeat(Math.min(password.pin.length, 6))
                            }
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(password.id + '-pin')}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 flex-shrink-0"
                            title={visiblePasswords.has(password.id + '-pin') ? "Hide PIN" : "Show PIN"}
                          >
                            {visiblePasswords.has(password.id + '-pin') ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(password.pin)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 flex-shrink-0"
                            title="Copy PIN"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditPassword(password)}
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePassword(password.id)}
                        className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                </td>
              </tr>
            ))
        ) : (
          <tr>
            <td colSpan={5} className="p-8 text-center">
            <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No passwords stored
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Add your first password to start managing your credentials securely.
            </p>
            </td>
          </tr>
        )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Password Modal */}
      {showAddModal && (
        <AddPasswordModal
          password={editingPassword}
          onClose={() => {
            setShowAddModal(false);
            setEditingPassword(null);
          }}
          onSave={(passwordData) => {
            // In a real app, you'd dispatch ADD_PASSWORD or UPDATE_PASSWORD
            console.log('Save password:', passwordData);
            setShowAddModal(false);
            setEditingPassword(null);
          }}
        />
      )}
    </div>
  );
}

// Add Password Modal Component
function AddPasswordModal({
  password,
  onClose,
  onSave,
}: {
  password: any;
  onClose: () => void;
  onSave: (password: any) => void;
}) {
  const { dispatch } = useData();
  const [formData, setFormData] = useState({
    name: password?.name || '',
    description: password?.description || '',
    username: password?.username || '',
    password: password?.password || '',
    pin: password?.pin || '',
    url: password?.url || '',
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: result });
  };

  const calculatePasswordStrength = (password: string): string => {
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)) {
      return 'strong';
    }
    return 'medium';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordData = {
      id: password?.id || uuidv4(),
      ...formData,
      lastUpdated: new Date().toISOString(),
      strength: calculatePasswordStrength(formData.password)
    };
    
    if (password) {
      dispatch({ type: 'UPDATE_PASSWORD', payload: passwordData });
    } else {
      dispatch({ type: 'ADD_PASSWORD', payload: passwordData });
    }
    
    onSave(passwordData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {password ? 'Edit Password' : 'Add New Password'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Netflix, Gmail, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Additional notes or security questions..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username/Email *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="username or email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={generatePassword}
                className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PIN
            </label>
            <input
              type="text"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
              placeholder="Enter PIN (optional)"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://example.com"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600"
            >
              {password ? 'Update' : 'Add'} Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}