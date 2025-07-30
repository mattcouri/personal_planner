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
  duration?: number; // Duration in minutes
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
  priority?: 'low' | 'medium' | 'high';
  projectId?: string;
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
  passwords: any[];
  habits: any[];
  habitLegend: Record<string, { icon: string; label: string; color: string }>;
  financialAccounts: any[];
  financialTransactions: any[];
  financialGoals: any[];
  healthScores: any[];
}

type Action =
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'UPDATE_TODO'; payload: Todo }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_DAILY_PLAN'; payload: { date: string; items: PlanItem[] } }
  | { type: 'SET_HABIT'; payload: any }
  | { type: 'SET_HEALTH_SCORE'; payload: any };

const initialState: AppState = {
  events: [],
  todos: [],
  dailyPlans: {},
  projects: [{ id: 'default', name: 'General' }],
  passwords: [
    {
      id: '1',
      name: 'Gmail',
      username: 'user@gmail.com',
      password: 'securePassword123',
      url: 'https://gmail.com',
      notes: 'Primary email account'
    }
  ],
  habits: [],
  habitLegend: {
    completed: { icon: '✓', label: 'Completed', color: '#10B981' },
    partial: { icon: '◐', label: 'Partial', color: '#F59E0B' },
    missed: { icon: '✗', label: 'Missed', color: '#EF4444' },
    notScheduled: { icon: '−', label: 'Not Scheduled', color: '#6B7280' },
  },
  financialAccounts: [
    { id: '1', name: 'Checking', type: 'checking', balance: 5000 },
    { id: '2', name: 'Savings', type: 'savings', balance: 15000 },
    { id: '3', name: 'Credit Card', type: 'credit', balance: -1200 }
  ],
  financialTransactions: [
    {
      id: '1',
      description: 'Salary',
      amount: 5000,
      type: 'income',
      category: 'Salary',
      date: new Date(),
      accountId: '1'
    },
    {
      id: '2',
      description: 'Groceries',
      amount: 150,
      type: 'expense',
      category: 'Food',
      date: new Date(),
      accountId: '1'
    }
  ],
  financialGoals: [
    {
      id: '1',
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 3500,
      deadline: new Date(2025, 11, 31),
      weeklyContribution: 200
    }
  ],
  healthScores: []
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
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        ),
      };
    case 'ADD_TODO':
      return { ...state, todos: [...state.todos, action.payload] };
    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id ? action.payload : todo
        ),
      };
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
      };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        // Move todos from deleted project to default project
        todos: state.todos.map(todo =>
          todo.projectId === action.payload
            ? { ...todo, projectId: 'default' }
            : todo
        ),
      };
    case 'SET_DAILY_PLAN':
      return {
        ...state,
        dailyPlans: {
          ...state.dailyPlans,
          [action.payload.date]: action.payload.items,
        },
      };
    case 'SET_HABIT':
      return {
        ...state,
        habits: [
          ...state.habits.filter(h => h.id !== action.payload.id),
          action.payload,
        ],
      };
    case 'SET_HEALTH_SCORE':
      return {
        ...state,
        healthScores: [
          ...state.healthScores.filter(s => s.id !== action.payload.id),
          action.payload,
        ],
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

      // Dummy Todo with duration
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
          duration: 120, // 2 hours in minutes
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