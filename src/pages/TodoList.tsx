import React, { useState } from 'react';
import { Plus, CheckSquare, Filter, Search, Folder, Calendar, Eye, EyeOff, FolderPlus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import QuickAddModal from '../components/QuickAddModal';
import ProjectModal from '../components/ProjectModal';
import { useDrop } from 'react-dnd';
import { useDrag } from 'react-dnd';

export default function TodoList() {
  const { state, dispatch } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editTodo, setEditTodo] = useState<any>(null);
  const [quickAddProjectId, setQuickAddProjectId] = useState<string>('');

  // Filter todos (exclude completed ones - they go to separate page)
  const filteredTodos = state.todos.filter(todo => {
    if (todo.completed && !showCompleted) return false;
    
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !filterProject || todo.projectId === filterProject;
    const matchesPriority = !filterPriority || todo.priority === filterPriority;
    
    return matchesSearch && matchesProject && matchesPriority;
  });

  const toggleTodo = (id: string) => {
    const todo = state.todos.find(t => t.id === id);
    if (todo) {
      dispatch({ type: 'UPDATE_TODO', payload: { ...todo, completed: !todo.completed } });
    }
  };

  const handleEditTodo = (todo: any) => {
    setEditTodo(todo);
    setShowQuickAdd(true);
  };

  const handleCloseModal = () => {
    setShowQuickAdd(false);
    setEditTodo(null);
    setQuickAddProjectId('');
  };

  const handleQuickAdd = (projectId?: string) => {
    if (projectId) {
      setQuickAddProjectId(projectId);
    }
    setShowQuickAdd(true);
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
    const projectColumns = state.projects.map(project => ({
      ...project,
      todos: filteredTodos
        .filter(todo => todo.projectId === project.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
    }));

    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {projectColumns.map(project => (
            <ProjectColumn 
              key={project.id} 
              project={project} 
              onToggleTodo={toggleTodo}
              onEditTodo={handleEditTodo}
              onMoveTask={moveTaskToProject}
              onReorderTodos={reorderTodosInProject}
              onDeleteTodo={deleteTodo}
              getPriorityColor={getPriorityColor}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>
      </div>
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
          <button 
            onClick={() => setShowProjectModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-all duration-200 border border-blue-300 dark:border-blue-700/50"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Projects</span>
          </button>
          
          <a
            href="/completed-tasks"
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-all duration-200 border border-green-300 dark:border-green-700/50"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Completed Tasks</span>
          </a>
          
          <button 
            onClick={() => handleQuickAdd()}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
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

      {showQuickAdd && (
        <QuickAddModal
          currentDate={new Date()}
          onClose={handleCloseModal}
          editItem={editTodo}
          editType="todo"
          defaultProjectId={quickAddProjectId}
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
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'todo-item',
    item: { id: todo.id, type: 'todo-move', todo, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag}
      className={`bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 cursor-move ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <button
          onClick={() => onToggle(todo.id)}
          className={`mt-1 w-4 h-4 rounded border-2 transition-all duration-200 ${
            todo.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 dark:border-gray-500 hover:border-primary-500'
          }`}
        >
          {todo.completed && (
            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 
            className={`font-medium text-sm cursor-pointer hover:text-primary-600 ${
              todo.completed 
                ? 'line-through text-gray-500 dark:text-gray-400' 
                : 'text-gray-900 dark:text-white'
            }`}
            onDoubleClick={() => onEdit(todo)}
          >
            {todo.title}
          </h4>
          
          {todo.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {todo.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
              {todo.priority}
            </span>
            
            {todo.dueDate && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(todo.dueDate, 'MMM d')}
              </span>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(todo.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-red-500 p-1"
              title="Delete task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
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
  onMoveTask, 
  onReorderTodos,
  onDeleteTodo,
  getPriorityColor,
  onQuickAdd
}: { 
  project: any; 
  onToggleTodo: (id: string) => void; 
  onEditTodo: (todo: any) => void;
  onMoveTask: (taskId: string, projectId: string) => void;
  onReorderTodos: (projectId: string, todos: any[]) => void;
  onDeleteTodo: (todoId: string) => void;
  getPriorityColor: (priority: string) => string;
  onQuickAdd: (projectId: string) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'todo-item',
    drop: (item: any) => {
      const didDrop = monitor.didDrop();
      if (didDrop) return;
      
      if (item.type === 'todo-move') {
        const draggedTodo = item.todo;
        
        if (draggedTodo.projectId === project.id) {
          // Reordering within the same project
          const hoverIndex = project.todos.length;
          const dragIndex = item.index;
          
          if (dragIndex !== hoverIndex) {
            const reorderedTodos = [...project.todos];
            const draggedItem = reorderedTodos.splice(dragIndex, 1)[0];
            reorderedTodos.splice(hoverIndex, 0, draggedItem);
            onReorderTodos(project.id, reorderedTodos);
          }
        } else {
          // Moving to different project
          onMoveTask(item.id, project.id);
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div className="flex-shrink-0 w-80">
      <div 
        ref={drop}
        className={`bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-700/50 transition-all duration-200 ${
          isOver ? 'ring-2 ring-primary-400 bg-primary-100 dark:bg-primary-800/30' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <Folder className="w-5 h-5 mr-2 text-primary-500" />
            {project.name}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onQuickAdd(project.id)}
              className="w-6 h-6 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              title="Add task to this project"
            >
              <Plus className="w-3 h-3" />
            </button>
            <span className="bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200 px-2 py-1 rounded-full text-sm font-medium">
              {project.todos.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
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
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks in this project</p>
              {isOver && (
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-2">
                  Drop task here
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}