import React, { useState } from 'react';
import { CheckSquare, Search, Folder, Calendar, ArrowLeft, Trash2, RotateCcw } from 'lucide-react';
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

  // Group completed todos by project (same structure as ToDo Lists page)
  const projectColumns = [...state.projects]
    .sort((a, b) => {
      if (a.id === 'unclassified') return -1;
      if (b.id === 'unclassified') return 1;
      return 0;
    })
    .map(project => ({
      ...project,
      todos: completedTodos
        .filter(todo => todo.projectId === project.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
    }));

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

  const getDisplayInfo = (todo: any) => {
    if (todo.limitDate) {
      return format(new Date(todo.limitDate), 'MMM d');
    }
    if (todo.dueDate) {
      return format(new Date(todo.dueDate), 'MMM d');
    }
    if (todo.duration) {
      return todo.duration >= 60 ? `${Math.floor(todo.duration / 60)}h${todo.duration % 60 > 0 ? ` ${todo.duration % 60}m` : ''}` : `${todo.duration}m`;
    }
    return '';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const totalCompleted = completedTodos.length;
  const completedToday = completedTodos.filter(todo => 
    todo.dueDate && new Date(todo.dueDate).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckSquare className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Completed Tasks Archive
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Completed</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{totalCompleted}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Completed Today</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{completedToday}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
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

      {/* Completed Tasks by Project */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {projectColumns.map(project => {
            const isUnclassified = project.id === 'unclassified';
            const backgroundClass = isUnclassified 
              ? 'bg-gray-100 dark:bg-gray-700' 
              : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20';
            const borderClass = isUnclassified
              ? 'border-gray-300 dark:border-gray-600'
              : 'border-green-200 dark:border-green-700/50';

            return (
              <div key={project.id} className="flex-shrink-0 w-64">
                <div className={`${backgroundClass} rounded-lg p-3 border ${borderClass}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                      <Folder className={`w-4 h-4 mr-1 ${isUnclassified ? 'text-gray-500' : 'text-green-500'}`} />
                      {project.name}
                    </h3>
                    <span className={`${isUnclassified ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200' : 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'} px-1.5 py-0.5 rounded-full text-xs font-medium`}>
                      {project.todos.length}
                    </span>
                  </div>
                  
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {project.todos.map((todo) => (
                      <div
                        key={todo.id}
                        className="bg-white dark:bg-gray-700 rounded-md p-2 shadow-sm border border-gray-200 dark:border-gray-600 group"
                      >
                        <div className="flex items-center space-x-2">
                          {/* Priority Indicator */}
                          <div 
                            className="w-1 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getPriorityColor(todo.priority) }}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-xs text-gray-500 dark:text-gray-400 line-through truncate" title={todo.title}>
                                {todo.title}
                              </h4>
                              
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                {getDisplayInfo(todo) && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {getDisplayInfo(todo)}
                                  </span>
                                )}
                                
                                <button
                                  onClick={() => uncompleteTask(todo.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-blue-500 p-0.5"
                                  title="Mark as incomplete"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                                
                                <button
                                  onClick={() => deleteTask(todo.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-red-500 p-0.5"
                                  title="Delete permanently"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {project.todos.length === 0 && (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <CheckSquare className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <p className="text-xs">No completed tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}