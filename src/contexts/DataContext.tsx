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
  projects: [
    { id: 'work', name: 'Work Projects' },
    { id: 'personal', name: 'Personal Tasks' },
    { id: 'health', name: 'Health & Fitness' }
  ],
  passwords: [
    {
      id: 'pwd1',
      name: 'Work Email',
      username: 'john.doe@company.com',
      password: 'WorkSecure2024!',
      url: 'https://gmail.com',
      notes: 'Company email account'
    },
    {
      id: 'pwd2',
      name: 'Banking',
      username: 'johndoe123',
      password: 'Bank$ecure789',
      url: 'https://mybank.com',
      notes: 'Main checking account'
    },
    {
      id: 'pwd3',
      name: 'Social Media',
      username: 'john_doe_2024',
      password: 'Social@Pass456',
      url: 'https://twitter.com',
      notes: 'Professional social media account'
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
    { id: 'acc1', name: 'Main Checking', type: 'checking', balance: 3250.75 },
    { id: 'acc2', name: 'Emergency Savings', type: 'savings', balance: 12500.00 },
    { id: 'acc3', name: 'Investment Account', type: 'investment', balance: 8750.25 }
  ],
  financialTransactions: [
    {
      id: 'txn1',
      description: 'Monthly Salary',
      amount: 4200,
      type: 'income',
      category: 'Salary',
      date: new Date(2024, 11, 1),
      accountId: 'acc1'
    },
    {
      id: 'txn2',
      description: 'Weekly Groceries',
      amount: 125.50,
      type: 'expense',
      category: 'Food',
      date: new Date(2024, 11, 15),
      accountId: 'acc1'
    },
    {
      id: 'txn3',
      description: 'Freelance Project',
      amount: 800,
      type: 'income',
      category: 'Freelance',
      date: new Date(2024, 11, 10),
      accountId: 'acc1'
    }
  ],
  financialGoals: [
    {
      id: 'goal1',
      name: 'Emergency Fund',
      targetAmount: 15000,
      currentAmount: 5200,
      deadline: new Date(2025, 11, 31),
      weeklyContribution: 150
    },
    {
      id: 'goal2',
      name: 'Vacation Fund',
      targetAmount: 5000,
      currentAmount: 1800,
      deadline: new Date(2025, 5, 30),
      weeklyContribution: 100
    },
    {
      id: 'goal3',
      name: 'New Laptop',
      targetAmount: 2500,
      currentAmount: 750,
      deadline: new Date(2025, 2, 15),
      weeklyContribution: 75
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
            ? { ...todo, projectId: 'work' }
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

      // Sample Events
      dispatch({
        type: 'ADD_EVENT',
        payload: {
          id: 'event1',
          title: 'Weekly Team Meeting',
          description: 'Review project progress and plan next steps',
          start: now,
          end: oneHourLater,
          color: '#3B82F6',
          location: 'Conference Room A',
          guests: ['sarah@company.com', 'mike@company.com'],
          meetLink: 'https://meet.google.com/abc-defg-hij',
        },
      });

      dispatch({
        type: 'ADD_EVENT',
        payload: {
          id: 'event2',
          title: 'Client Presentation',
          description: 'Present Q4 results to key stakeholders',
          start: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          end: new Date(now.getTime() + 3 * 60 * 60 * 1000),
          color: '#10B981',
          location: 'Main Office',
          guests: ['client@company.com'],
        },
      });

      dispatch({
        type: 'ADD_EVENT',
        payload: {
          id: 'event3',
          title: 'Lunch Break',
          description: 'Team lunch at the new restaurant',
          start: new Date(now.getTime() + 4 * 60 * 60 * 1000),
          end: new Date(now.getTime() + 5 * 60 * 60 * 1000),
          color: '#F59E0B',
          location: 'Downtown Restaurant',
        },
      });

      // Sample Todos
      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo1',
          title: 'Complete Project Proposal',
          description: 'Finalize the Q1 project proposal document',
          completed: false,
          priority: 'high',
          projectId: 'work',
          dueDate: now,
          createdAt: new Date(),
          duration: 180,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo2',
          title: 'Review Code Changes',
          description: 'Review pull requests from the development team',
          completed: false,
          priority: 'medium',
          projectId: 'work',
          dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 90,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo3',
          title: 'Plan Weekend Trip',
          description: 'Research and book accommodation for weekend getaway',
          completed: false,
          priority: 'low',
          projectId: 'personal',
          dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 60,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo4',
          title: 'Morning Workout',
          description: '45-minute cardio and strength training session',
          completed: true,
          priority: 'medium',
          projectId: 'health',
          dueDate: now,
          createdAt: new Date(),
          duration: 45,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo5',
          title: 'Grocery Shopping',
          description: 'Buy ingredients for meal prep this week',
          completed: false,
          priority: 'medium',
          projectId: 'personal',
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 75,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo6',
          title: 'Schedule Annual Checkup',
          description: 'Book appointment with primary care physician',
          completed: false,
          priority: 'high',
          projectId: 'health',
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      });

      // Sample Daily Plan
      dispatch({
        type: 'SET_DAILY_PLAN',
        payload: {
          date: dateKey,
          items: [
            {
              id: 'plan1',
              title: 'Weekly Team Meeting',
              description: 'Review project progress and plan next steps',
              type: 'event',
              start: now,
              end: oneHourLater,
              originalId: 'event1',
              completed: false,
              location: 'Conference Room A',
              guests: ['sarah@company.com', 'mike@company.com'],
              meetLink: 'https://meet.google.com/abc-defg-hij',
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