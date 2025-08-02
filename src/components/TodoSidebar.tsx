import React from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useDraggable } from '@dnd-kit/core';

interface TodoSidebarProps {
  onQuickAdd: () => void;
}

export default function TodoSidebar({ onQuickAdd }: TodoSidebarProps) {
  const { state } = useData();

  // Show high priority and overdue todos
  const priorityTodos = state.todos.filter(todo => 
    !todo.completed && 
    (todo.priority === 'high' || todo.dueDate < new Date())
  ).slice(0, 5);

  const completedToday = state.todos.filter(todo => 
    todo.completed && 
    todo.dueDate && 
    new Date(todo.dueDate).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-4 h-full">
      {/* Quick Stats */}
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-primary-500" />
            Quick Stats
          </h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700/50">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Completed Today</span>
            </div>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">{completedToday}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700/50">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">High Priority</span>
            </div>
            <span className="text-lg font-bold text-red-600 dark:text-red-400">
              {state.todos.filter(t => !t.completed && t.priority === 'high').length}
            </span>
          </div>
        </div>
      </div>

      {/* Priority Tasks */}
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <div className="w-5 h-5 mr-2 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            Priority Tasks
          </h2>
          <button
            onClick={onQuickAdd}
            className="text-sm px-3 py-1 rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {priorityTodos.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {priorityTodos.map((todo) => (
              <DraggableTodo key={todo.id} todo={todo} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No high priority tasks!
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableTodo({ todo }: { todo: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: todo.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-lg shadow-sm cursor-move hover:shadow-md transition-all duration-200 ${
        todo.dueDate < new Date() 
          ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50' 
          : 'bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700/50'
      }`}
    >
      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
        {todo.title}
      </h4>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center space-x-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            todo.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
            todo.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          }`}>
            {todo.priority}
          </span>
          {todo.dueDate < new Date() && (
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
              Overdue
            </span>
          )}
        </div>
        {todo.duration && (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {todo.duration >= 60 ? `${Math.floor(todo.duration / 60)}h` : `${todo.duration}m`}
            {todo.duration >= 60 && todo.duration % 60 > 0 && ` ${todo.duration % 60}m`}
          </span>
        )}
      </div>
    </div>
  );
}