import React, { useState } from 'react';
import { Plus, CheckSquare, Filter, Search, Folder, Calendar, Eye, EyeOff, FolderPlus, Trash2, Target } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import TodoModal from '../components/TodoModal';
import ProjectModal from '../components/ProjectModal';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragDropProvider from '../components/DragDropProvider';

export default function TodoList() {
  const { state, dispatch } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editTodo, setEditTodo] = useState<any>(null);
  const [todoProjectId, setTodoProjectId] = useState<string>('');

  // Filter todos (exclude completed ones - they go to separate page)
  const filteredTodos = state.todos.filter(todo => {
    if (todo.completed && !showCompleted) return false;
    
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !filterProject || todo.projectId === filterProject;
    const matchesPriority = !filterPriority || todo.priority === filterPriority;
    
    return matchesSearch && matchesProject && matchesPriority;
  });

  // Calculate KPI metrics
  const calculateKPIs = () => {
    const totalTodos = state.todos.filter(todo => !todo.completed).length;
    const completedTodos = state.todos.filter(todo => todo.completed).length;
    const overdueTodos = state.todos.filter(todo => 
      !todo.completed && todo.dueDate && new Date(todo.dueDate) < new Date()
    ).length;
    const highPriorityTodos = state.todos.filter(todo => 
      !todo.completed && todo.priority === 'high'
    ).length;
    
    return {
      totalTodos,
      completedTodos,
      overdueTodos,
      highPriorityTodos
    };
  };

  const kpis = calculateKPIs();

  const toggleTodo = (id: string) => {
    const todo = state.todos.find(t => t.id === id);
    if (todo) {
      dispatch({ type: 'UPDATE_TODO', payload: { ...todo, completed: !todo.completed } });
    }
  };

  const handleEditTodo = (todo: any) => {
    setEditTodo(todo);
    setShowTodoModal(true);
  };

  const handleCloseModal = () => {
    setShowTodoModal(false);
    setEditTodo(null);
    setTodoProjectId('');
  };

  const handleAddTodo = (projectId?: string) => {
    if (projectId) {
      setTodoProjectId(projectId);
    }
    setShowTodoModal(true);
  };

  const moveTaskToProject = (taskId: string, newProjectId: string) => {
    const todo = state.todos.find(t => t.id === taskId);
    if (todo && todo.projectId !== newProjectId) {
      // Get the highest position in the target project
      const targetProjectTodos = state.todos.filter(t => t.projectId === newProjectId);
      const newPosition = targetProjectTodos.length;
      
      dispatch({
        type: 'MOVE_TODO_TO_PROJECT',
        payload: { todoId: taskId, newProjectId, newPosition }
      });
    }
  };

  const reorderTodosInProject = (projectId: string, reorderedTodos: any[]) => {
    const updatedTodos = reorderedTodos.map((todo, index) => ({
      ...todo,
      position: index
    }));
    
    dispatch({
      type: 'REORDER_TODOS',
      payload: { projectId, todos: updatedTodos }
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    // Check if we're dropping on a project column
    if (overId.startsWith('project-')) {
      const newProjectId = overId.replace('project-', '');
      const draggedTodo = state.todos.find(t => t.id === activeId);
      
      if (draggedTodo && draggedTodo.projectId !== newProjectId) {
        moveTaskToProject(activeId, newProjectId);
      }
    }
    
    // Handle reordering within the same project
    if (activeId !== overId) {
      const activeItem = state.todos.find(t => t.id === activeId);
      const overItem = state.todos.find(t => t.id === overId);
      
      if (activeItem && overItem && activeItem.projectId === overItem.projectId) {
        const projectTodos = state.todos
          .filter(t => t.projectId === activeItem.projectId)
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        
        const oldIndex = projectTodos.findIndex(t => t.id === activeId);
        const newIndex = projectTodos.findIndex(t => t.id === overId);
        
        const reorderedTodos = [...projectTodos];
        const [removed] = reorderedTodos.splice(oldIndex, 1);
        reorderedTodos.splice(newIndex, 0, removed);
        
        reorderTodosInProject(activeItem.projectId, reorderedTodos);
      }
    }
  };

  const deleteTodo = (todoId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      dispatch({ type: 'DELETE_TODO', payload: todoId });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50';
      default: return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50';
    }
  };

  const getProjectName = (projectId?: string) => {
    return state.projects.find(p => p.id === projectId)?.name || 'No Project';
  };

  const renderKanbanView = () => {
    // Ensure Unclassified is always first
    const sortedProjects = [...state.projects].sort((a, b) => {
      if (a.id === 'unclassified') return -1;
      if (b.id === 'unclassified') return 1;
      return 0;
    });
    
    const projectColumns = sortedProjects.map(project => ({
      ...project,
      todos: filteredTodos
        .filter(todo => todo.projectId === project.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
    }));

    return (
      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {projectColumns.map(project => (
              <ProjectColumn 
                key={project.id} 
                project={project} 
                onToggleTodo={toggleTodo}
                onEditTodo={handleEditTodo}
                onDeleteTodo={deleteTodo}
                getPriorityColor={getPriorityColor}
                onAddTodo={handleAddTodo}
              />
            ))}
          </div>
        </div>
      </DragDropProvider>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckSquare className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            To-Do Lists
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/completed-tasks"
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Completed Tasks</span>
          </a>
          
          <button 
            onClick={() => setShowProjectModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Projects</span>
          </button>
          
          <button 
            onClick={() => handleAddTodo()}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Tasks</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{kpis.totalTodos}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{kpis.completedTodos}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Overdue</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{kpis.overdueTodos}</p>
            </div>
            <Calendar className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">High Priority</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{kpis.highPriorityTodos}</p>
            </div>
            <Target className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filter Tasks
          </h3>

          {/* Show Completed Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showCompleted
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {showCompleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {showCompleted ? 'Hide' : 'Show'} completed
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Projects</option>
            {state.projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {renderKanbanView()}

      {showTodoModal && (
        <TodoModal
          currentDate={new Date()}
          onClose={handleCloseModal}
          editTodo={editTodo}
          defaultProjectId={todoProjectId}
        />
      )}

      {showProjectModal && (
        <ProjectModal onClose={() => setShowProjectModal(false)} />
      )}
    </div>
  );
}

// Draggable Todo Item Component
function DraggableTodoItem({ 
  todo, 
  onToggle, 
  onEdit, 
  onDelete,
  getPriorityColor,
  index
}: { 
  todo: any; 
  onToggle: (id: string) => void; 
  onEdit: (todo: any) => void;
  onDelete: (id: string) => void;
  getPriorityColor: (priority: string) => string;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate display date/duration
  const getDisplayInfo = () => {
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

  const getPriorityIndicator = () => {
    const colors = {
      high: '#EF4444',
      medium: '#F59E0B', 
      low: '#10B981'
    };
    return colors[todo.priority as keyof typeof colors] || 'transparent';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-gray-700 rounded-md p-2 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 cursor-move group ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div className="flex items-center space-x-2">
        {/* Priority Indicator */}
        <div 
          className="w-1 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: getPriorityIndicator() }}
        />
        
        <button
          onClick={() => onToggle(todo.id)}
          className={`w-3 h-3 rounded border transition-all duration-200 flex-shrink-0 ${
            todo.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 dark:border-gray-500 hover:border-primary-500'
          }`}
        >
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 
              className={`font-medium text-xs cursor-pointer hover:text-primary-600 truncate ${
                todo.completed 
                  ? 'line-through text-gray-500 dark:text-gray-400' 
                  : 'text-gray-900 dark:text-white'
              }`}
              onDoubleClick={() => onEdit(todo)}
              title={todo.title}
            >
              {todo.title}
            </h4>
            
            <div className="flex items-center space-x-1 flex-shrink-0">
              {getDisplayInfo() && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {getDisplayInfo()}
                </span>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(todo.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-red-500 p-0.5"
                title="Delete task"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Project Column Component with Drop Zone
function ProjectColumn({ 
  project, 
  onToggleTodo, 
  onEditTodo, 
  onDeleteTodo,
  getPriorityColor,
  onAddTodo
}: { 
  project: any; 
  onToggleTodo: (id: string) => void; 
  onEditTodo: (todo: any) => void;
  onDeleteTodo: (todoId: string) => void;
  getPriorityColor: (priority: string) => string;
  onAddTodo: (projectId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `project-${project.id}`,
  });

  // Special styling for Unclassified project
  const isUnclassified = project.id === 'unclassified';
  const backgroundClass = isUnclassified 
    ? 'bg-gray-100 dark:bg-gray-700' 
    : 'bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20';
  const borderClass = isUnclassified
    ? 'border-gray-300 dark:border-gray-600'
    : 'border-primary-200 dark:border-primary-700/50';
  return (
    <div className="flex-shrink-0 w-64">
      <div 
        ref={setNodeRef}
        className={`${backgroundClass} rounded-lg p-3 border ${borderClass} transition-all duration-200 ${
          isOver ? 'ring-2 ring-primary-400 bg-primary-100 dark:bg-primary-800/30' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
            <Folder className={`w-4 h-4 mr-1 ${isUnclassified ? 'text-gray-500' : 'text-primary-500'}`} />
            {project.name}
          </h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onAddTodo(project.id)}
              className={`w-5 h-5 ${isUnclassified ? 'bg-gray-500 hover:bg-gray-600' : 'bg-primary-500 hover:bg-primary-600'} text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110`}
              title="Add task to this project"
            >
              <Plus className="w-3 h-3" />
            </button>
            <span className={`${isUnclassified ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200' : 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200'} px-1.5 py-0.5 rounded-full text-xs font-medium`}>
              {project.todos.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {project.todos.map((todo, index) => (
            <DraggableTodoItem
              key={todo.id}
              todo={todo}
              index={index}
              onToggle={onToggleTodo}
              onEdit={onEditTodo}
              onDelete={onDeleteTodo}
              getPriorityColor={getPriorityColor}
            />
          ))}
          
          {project.todos.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <CheckSquare className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No tasks</p>
              {isOver && (
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                  Drop here
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}