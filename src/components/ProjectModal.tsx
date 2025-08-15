import React, { useState } from 'react';
import { X, Plus, Folder, Edit3, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { v4 as uuidv4 } from 'uuid';

interface ProjectModalProps {
  onClose: () => void;
}

export default function ProjectModal({ onClose }: ProjectModalProps) {
  const { state, dispatch } = useData();
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      const newProject = {
        id: uuidv4(),
        name: newProjectName.trim(),
      };
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      setNewProjectName('');
    }
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project.id);
    setEditName(project.name);
  };

  const handleSaveEdit = (projectId: string) => {
    if (editName.trim()) {
      dispatch({ 
        type: 'UPDATE_PROJECT', 
        payload: { id: projectId, name: editName.trim() } 
      });
    }
    setEditingProject(null);
    setEditName('');
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? All tasks will be moved to "General".')) {
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    }
  };

  const getProjectTaskCount = (projectId: string) => {
    return state.todos.filter(todo => todo.projectId === projectId).length;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Folder className="w-5 h-5 mr-2 text-primary-500" />
            Manage Projects
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Project */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <form onSubmit={handleCreateProject} className="flex space-x-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>
          </form>
        </div>

        {/* Projects List */}
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Existing Projects
          </h4>
          
          <div className="space-y-3">
            {state.projects.map(project => (
              <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3 flex-1">
                  <Folder className="w-5 h-5 text-primary-500" />
                  
                  {editingProject === project.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleSaveEdit(project.id)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(project.id)}
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getProjectTaskCount(project.id)} tasks
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditProject(project)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  {project.id !== 'unclassified' && (
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}