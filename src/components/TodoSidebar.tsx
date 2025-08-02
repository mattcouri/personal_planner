import React from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useDraggable } from '@dnd-kit/core';

interface TodoSidebarProps {
  onQuickAdd: () => void;
}

export default function TodoSidebar({ onQuickAdd }: TodoSidebarProps) {
  const { state } = useData();

  // Show all incomplete todos
  const allTodos = state.todos.filter(todo => !todo.completed);

  const completedToday = state.todos.filter(todo => 
    todo.completed && 
    todo.dueDate && 
    new Date(todo.dueDate).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="h-full">
      {/* All To-Dos */}
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-primary-500" />
            To-Dos
          </h2>
          <div className="flex items-center space-x-3">
            <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
              {allTodos.length} active
            </span>
            <button
              onClick={onQuickAdd}
              className="text-sm px-3 py-1 rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {allTodos.length > 0 ? (
          <div className="space-y-2 max-h-full overflow-y-auto">
            {allTodos.map((todo) => (
              <DraggableTodo key={todo.id} todo={todo} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No active todos!
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
      className={`p-3 rounded-lg shadow-sm cursor-move hover:shadow-md transition-all duration-200 border ${
        todo.priority === 'high' 
          ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700/50' 
          : todo.priority === 'medium'
          ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700/50'
          : 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700/50'
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