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
    },
  }));

  return (
    <div
      ref={drag}
      className="p-3 bg-amber-100 dark:bg-yellow-900/30 border border-amber-300 dark:border-yellow-700 rounded-lg shadow-sm cursor-move"
    >
      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
        {todo.title}
      </h4>
    </div>
  );
}
