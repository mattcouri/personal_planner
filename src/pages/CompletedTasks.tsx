import React, { useState } from 'react';
import { CheckSquare, Search, Folder, Calendar, ArrowLeft, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';

export default function CompletedTasks() {
  const { state, dispatch } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('');

  // Filter completed todos only
  const completedTodos = state.todos.filter(todo => {
    if (!todo.completed) return false;
    
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !filterProject || todo.projectId === filterProject;
    
    return matchesSearch && matchesProject;
  });

  const uncompleteTask = (id: string) => {
    const todo = state.todos.find(t => t.id === id);
    if (todo) {
      dispatch({ type: 'UPDATE_TODO', payload: { ...todo, completed: false } });
    }
  };

  const deleteTask = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this task?')) {
      dispatch({ type: 'DELETE_TODO', payload: id });
    }
  };

  const getProjectName = (projectId?: string) => {
    return state.projects.find(p => p.id === projectId)?.name || 'No Project';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50';
      default: return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckSquare className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Completed Tasks
          </h1>
        </div>

        <a
          href="/todos"
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to To-Do Lists</span>
        </a>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-xl border border-green-200/50 dark:border-green-700/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tasks Completed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Great job on finishing these tasks!
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {completedTodos.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">total completed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search completed tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Projects</option>
            {state.projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Completed Tasks List */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 divide-y divide-gray-200 dark:divide-gray-700">
        {completedTodos.length > 0 ? (
          completedTodos.map(todo => (
            <div key={todo.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200">
              <div className="flex items-start space-x-4">
                <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-500 text-white flex items-center justify-center mt-1">
                  <CheckSquare className="w-3 h-3" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 line-through">
                    {todo.title}
                  </h3>
                  
                  {todo.description && (
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {todo.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 mt-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)} opacity-75`}>
                      {todo.priority}
                    </span>

                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Folder className="w-4 h-4 mr-1" />
                      {getProjectName(todo.projectId)}
                    </div>

                    {todo.dueDate && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(todo.dueDate, 'MMM d, yyyy')}
                      </div>
                    )}

                    {todo.duration && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {todo.duration >= 60 ? `${Math.floor(todo.duration / 60)}h` : `${todo.duration}m`}
                          {todo.duration >= 60 && todo.duration % 60 > 0 && ` ${todo.duration % 60}m`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => uncompleteTask(todo.id)}
                    className="text-gray-400 hover:text-blue-500 transition-colors duration-200 p-2"
                    title="Mark as incomplete"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTask(todo.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <CheckSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No completed tasks
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Complete some tasks to see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}