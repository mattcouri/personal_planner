// contexts/DataContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

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

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
