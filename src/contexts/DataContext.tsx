// contexts/DataContext.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';

interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color?: string;
  location?: string;
  guests?: string[];
  meetLink?: string;
}

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  dueDate: Date;
  createdAt: Date;
}

interface PlanItem {
  id: string;
  title: string;
  description?: string;
  type: 'event' | 'todo';
  start: Date;
  end: Date;
  originalId: string;
  completed: boolean;
  location?: string;
  guests?: string[];
  meetLink?: string;
}

interface Project {
  id: string;
  name: string;
}

interface AppState {
  events: Event[];
  todos: Todo[];
  dailyPlans: Record<string, PlanItem[]>;
  projects: Project[];
}

type Action =
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'SET_DAILY_PLAN'; payload: { date: string; items: PlanItem[] } };

const initialState: AppState = {
  events: [],
  todos: [],
  dailyPlans: {},
  projects: [{ id: 'default', name: 'General' }],
};

const DataContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'ADD_TODO':
      return { ...state, todos: [...state.todos, action.payload] };
    case 'SET_DAILY_PLAN':
      return {
        ...state,
        dailyPlans: {
          ...state.dailyPlans,
          [action.payload.date]: action.payload.items,
        },
      };
    default:
      return state;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.events.length === 0 && state.todos.length === 0) {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const dateKey = now.toISOString().split('T')[0];

      // Dummy Event
      dispatch({
        type: 'ADD_EVENT',
        payload: {
          id: 'demo-event-1',
          title: 'Demo Event: Team Standup',
          description: 'Discuss tasks and blockers',
          start: now,
          end: oneHourLater,
          color: '#3B82F6',
          location: 'Zoom',
          guests: ['alice@demo.com', 'bob@demo.com'],
          meetLink: 'https://meet.google.com/demo',
        },
      });

      // Dummy Todo
      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'demo-todo-1',
          title: 'Demo Todo: Update Dashboard',
          description: 'Update sales dashboard for leadership',
          completed: false,
          priority: 'high',
          projectId: 'default',
          dueDate: now,
          createdAt: new Date(),
        },
      });

      // Dummy Daily Plan
      dispatch({
        type: 'SET_DAILY_PLAN',
        payload: {
          date: dateKey,
          items: [
            {
              id: 'demo-plan-1',
              title: 'Demo Event: Team Standup',
              description: 'Discuss tasks and blockers',
              type: 'event',
              start: now,
              end: oneHourLater,
              originalId: 'demo-event-1',
              completed: false,
              location: 'Zoom',
              guests: ['alice@demo.com', 'bob@demo.com'],
              meetLink: 'https://meet.google.com/demo',
            },
          ],
        },
      });
    }
  }, []);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
