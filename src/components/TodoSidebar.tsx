// components/TodoSidebar.tsx
import React from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useDrag } from 'react-dnd';

interface TodoSidebarProps {
  onQuickAdd: () => void;
}

export default function TodoSidebar({ onQuickAdd }: TodoSidebarProps) {
  const { state } = useData();

  const todos = state.todos.filter(todo => !todo.completed);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ClipboardList className="w-5 h-5 mr-2 text-primary-500" />
          Todo Items
        </h2>
        <button
          onClick={onQuickAdd}
          className="text-sm px-3 py-1 rounded-md bg-primary-500 text-white hover:bg-primary-600 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {todos.length > 0 ? (
        <div className="space-y-2">
          {todos.map((todo) => (
            <DraggableTodo key={todo.id} todo={todo} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No pending tasks.
        </p>
      )}
    </div>
  );
}

function DraggableTodo({ todo }: { todo: any }) {
  const [, drag] = useDrag(() => ({
    type: 'todo-item',
    item: {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      sourceType: 'todo',
      duration: todo.duration || 60, // Include duration for proper scheduling
      priority: todo.priority,
      projectId: todo.projectId,
      completed: todo.completed,
    },
  }));

  return (
    <div
      ref={drag}
      className="p-3 bg-amber-100 dark:bg-yellow-900/30 border border-amber-300 dark:border-yellow-700 rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow"
    >
      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
        {todo.title}
      </h4>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          todo.priority === 'high' ? 'bg-red-100 text-red-700' :
          todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {todo.priority}
        </span>
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