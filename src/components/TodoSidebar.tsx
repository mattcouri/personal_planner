// components/TodoSidebar.tsx
import React from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useDrag } from 'react-dnd';

interface TodoSidebarProps {
  onQuickAdd: () => void;
}

export default function TodoSidebar({ onQuickAdd }: TodoSidebarProps) {
  const { state } = useData();

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ClipboardList className="w-5 h-5 mr-2 text-primary-500" />
          Todos
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Drag a task into your daily plan
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {state.todos.map((todo) => (
          <DraggableTodo key={todo.id} todo={todo} />
        ))}
        {state.todos.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No todos yet. Use Quick Add.
          </p>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onQuickAdd}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:scale-105 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Add</span>
        </button>
      </div>
    </div>
  );
}

function DraggableTodo({ todo }: { todo: any }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'todo-item',
    item: {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      sourceType: 'todo',
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-3 rounded-lg border cursor-move transition-all duration-200 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${
        todo.completed
          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700/40'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50'
      }`}
    >
      <h4 className="text-sm font-medium truncate text-gray-900 dark:text-white">
        {todo.title}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
        {todo.description}
      </p>
    </div>
  );
}
