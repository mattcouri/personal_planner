import React from 'react';
import { format, isSameDay } from 'date-fns';
import { useData } from '../contexts/DataContext';
import { useDrag } from 'react-dnd';
import { CheckCircle2, Circle, ClipboardList, Plus, Trash2 } from 'lucide-react';

interface TodoSidebarProps {
  onQuickAdd: () => void;
}

interface DraggableTodoProps {
  item: any;
  children: React.ReactNode;
}

function DraggableTodo({ item, children }: DraggableTodoProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'todo-item',
    item: { ...item, sourceType: 'todo' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  return (
    <div
      ref={drag}
      className={`cursor-move transition-opacity duration-200 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {children}
    </div>
  );
}

export default function TodoSidebar({ onQuickAdd }: TodoSidebarProps) {
  const { state, dispatch } = useData();
  const today = new Date();
  const dateKey = format(today, 'yyyy-MM-dd');
  const dailyPlan = state.dailyPlans[dateKey] || [];

  const scheduledTodoIds = dailyPlan
    .filter((item) => item.type === 'todo')
    .map((item) => item.originalId);

  const unscheduledTodos = state.todos.filter(
    (todo) =>
      !scheduledTodoIds.includes(todo.id) &&
      todo.dueDate &&
      isSameDay(new Date(todo.dueDate), today)
  );

  const handleEdit = (todo: any) => {
    const newTitle = prompt('Edit to-do title', todo.title);
    if (newTitle) {
      dispatch({ type: 'UPDATE_TODO', payload: { ...todo, title: newTitle } });
    }
  };

  const softDelete = (id: string) => {
    // In the future this can set a hidden flag instead
    dispatch({
      type: 'UPDATE_TODO',
      payload: { ...state.todos.find((t) => t.id === id), deleted: true },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-primary-500" />
            Today's To-Dos
          </h3>
          <button
            onClick={onQuickAdd}
            className="p-1 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {unscheduledTodos.length > 0 ? (
            unscheduledTodos.map((todo) => (
              <DraggableTodo key={todo.id} item={todo}>
                <div
                  onDoubleClick={() => handleEdit(todo)}
                  className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {todo.title}
                      </h4>
                      {todo.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                          {todo.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-2 flex items-center space-x-1">
                      <button
                        onClick={() => softDelete(todo.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500"
                        title="Hide from view"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    </div>
                  </div>
                </div>
              </DraggableTodo>
            ))
          ) : (
            <div className="text-center py-8">
              <Circle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No pending to-dos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
