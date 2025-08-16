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
  position: number; // Position within project for ordering
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
  | { type: 'REORDER_TODOS'; payload: { projectId: string; todos: Todo[] } }
  | { type: 'MOVE_TODO_TO_PROJECT'; payload: { todoId: string; newProjectId: string; newPosition: number } }
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
    { id: 'unclassified', name: 'Unclassified' },
    { id: 'work', name: 'Work Projects' },
    { id: 'personal', name: 'Personal Tasks' },
    { id: 'health', name: 'Health & Fitness' },
    { id: 'finance', name: 'Financial Planning' },
    { id: 'learning', name: 'Learning & Development' },
    { id: 'home', name: 'Home & Family' },
    { id: 'creative', name: 'Creative Projects' },
    { id: 'travel', name: 'Travel & Adventures' }
  ],
  passwords: [
    {
      id: 'pwd001',
      name: 'Netflix Account',
      username: 'user.netflix@email.com',
      password: 'Stream2024!',
      url: 'https://netflix.com',
      notes: 'Family streaming account'
    },
    {
      id: 'pwd002',
      name: 'GitHub Repository',
      username: 'developer_pro',
      password: 'Code#Secure456',
      url: 'https://github.com',
      notes: 'Development projects repository'
    },
    {
      id: 'pwd003',
      name: 'Cloud Storage',
      username: 'cloud.user.2024',
      password: 'Storage&Safe789',
      url: 'https://drive.google.com',
      notes: 'Personal file backup service'
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
    { id: 'acc001', name: 'Primary Checking', type: 'checking', balance: 4850.32 },
    { id: 'acc002', name: 'High Yield Savings', type: 'savings', balance: 18750.00 },
    { id: 'acc003', name: 'Retirement 401k', type: 'investment', balance: 45200.85 }
  ],
  financialTransactions: [
    {
      id: 'txn001',
      description: 'Freelance Web Design',
      amount: 2800,
      type: 'income',
      category: 'Freelance',
      date: new Date(2024, 11, 5),
      accountId: 'acc001'
    },
    {
      id: 'txn002',
      description: 'Monthly Rent Payment',
      amount: 1450.00,
      type: 'expense',
      category: 'Housing',
      date: new Date(2024, 11, 1),
      accountId: 'acc001'
    },
    {
      id: 'txn003',
      description: 'Investment Dividend',
      amount: 340.75,
      type: 'income',
      category: 'Investment',
      date: new Date(2024, 11, 12),
      accountId: 'acc003'
    }
  ],
  financialGoals: [
    {
      id: 'goal001',
      name: 'Home Down Payment',
      targetAmount: 50000,
      currentAmount: 12500,
      deadline: new Date(2026, 5, 30),
      weeklyContribution: 400
    },
    {
      id: 'goal002',
      name: 'European Trip',
      targetAmount: 8000,
      currentAmount: 2400,
      deadline: new Date(2025, 7, 15),
      weeklyContribution: 125
    },
    {
      id: 'goal003',
      name: 'Professional Camera',
      targetAmount: 3500,
      currentAmount: 950,
      deadline: new Date(2025, 3, 20),
      weeklyContribution: 85
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
    case 'REORDER_TODOS':
      return {
        ...state,
        todos: state.todos.map(todo => {
          const updatedTodo = action.payload.todos.find(t => t.id === todo.id);
          return updatedTodo || todo;
        }),
      };
    case 'MOVE_TODO_TO_PROJECT':
      return {
        ...state,
        todos: state.todos.map(todo => {
          if (todo.id === action.payload.todoId) {
            return { ...todo, projectId: action.payload.newProjectId, position: action.payload.newPosition };
          }
          // Adjust positions of other todos in the target project
          if (todo.projectId === action.payload.newProjectId && todo.position >= action.payload.newPosition) {
            return { ...todo, position: todo.position + 1 };
          }
          return todo;
        }),
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
            ? { ...todo, projectId: 'unclassified' }
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
          id: 'event001',
          title: 'Client Strategy Session',
          description: 'Quarterly business review and planning',
          start: now,
          end: oneHourLater,
          color: '#10B981',
          location: 'Executive Boardroom',
          guests: ['client@company.com', 'manager@company.com'],
          meetLink: 'https://meet.google.com/xyz-abcd-efg',
        },
      });

      dispatch({
        type: 'ADD_EVENT',
        payload: {
          id: 'event002',
          title: 'Product Demo Workshop',
          description: 'Showcase new features to development team',
          start: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          end: new Date(now.getTime() + 3 * 60 * 60 * 1000),
          color: '#F59E0B',
          location: 'Innovation Lab',
          guests: ['dev.team@company.com'],
        },
      });

      dispatch({
        type: 'ADD_EVENT',
        payload: {
          id: 'event003',
          title: 'Design Review Meeting',
          description: 'Review UI/UX mockups for mobile app',
          start: new Date(now.getTime() + 4 * 60 * 60 * 1000),
          end: new Date(now.getTime() + 5 * 60 * 60 * 1000),
          color: '#8B5CF6',
          location: 'Design Studio',
          guests: ['design@company.com', 'product@company.com'],
        },
      });

      // Sample Todos
      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo001',
          title: 'Complete API documentation',
          description: 'Write comprehensive docs for new REST endpoints',
          completed: false,
          priority: 'high',
          projectId: 'work',
          dueDate: now,
          createdAt: new Date(),
          duration: 240,
          position: 0,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo002',
          title: 'Database optimization',
          description: 'Improve query performance for user dashboard',
          completed: false,
          priority: 'high',
          projectId: 'work',
          dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 180,
          position: 1,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo003',
          title: 'Security audit review',
          description: 'Address vulnerabilities found in latest scan',
          completed: false,
          priority: 'medium',
          projectId: 'work',
          dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 120,
          position: 2,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo004',
          title: 'Plan weekend hiking trip',
          description: 'Research trails and book camping reservations',
          completed: false,
          priority: 'medium',
          projectId: 'personal',
          dueDate: now,
          createdAt: new Date(),
          duration: 60,
          position: 0,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo005',
          title: 'Organize photo collection',
          description: 'Sort and backup vacation photos from last year',
          completed: false,
          priority: 'low',
          projectId: 'personal',
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 90,
          position: 1,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo006',
          title: 'Update personal website',
          description: 'Add recent projects and refresh portfolio',
          completed: false,
          priority: 'medium',
          projectId: 'personal',
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 150,
          position: 2,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo007',
          title: 'Join yoga classes',
          description: 'Research local studios and sign up for beginner course',
          completed: false,
          priority: 'high',
          projectId: 'health',
          dueDate: now,
          createdAt: new Date(),
          duration: 30,
          position: 0,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo008',
          title: 'Schedule annual checkup',
          description: 'Book appointments with doctor and dentist',
          completed: false,
          priority: 'medium',
          projectId: 'health',
          dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 20,
          position: 1,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo009',
          title: 'Start meditation practice',
          description: 'Download app and commit to 10 minutes daily',
          completed: false,
          priority: 'low',
          projectId: 'health',
          dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 15,
          position: 2,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo010',
          title: 'Set up automatic savings',
          description: 'Configure monthly transfer to emergency fund',
          completed: false,
          priority: 'high',
          projectId: 'finance',
          dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 45,
          position: 0,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo011',
          title: 'Research investment options',
          description: 'Compare index funds vs individual stocks',
          completed: false,
          priority: 'medium',
          projectId: 'finance',
          dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 90,
          position: 1,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo012',
          title: 'Update budget spreadsheet',
          description: 'Track expenses and adjust monthly budget',
          completed: false,
          priority: 'low',
          projectId: 'finance',
          dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 60,
          position: 2,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo013',
          title: 'Learn TypeScript fundamentals',
          description: 'Complete online course on advanced TypeScript',
          completed: false,
          priority: 'high',
          projectId: 'learning',
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 180,
          position: 0,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo014',
          title: 'Read design patterns book',
          description: 'Study software architecture best practices',
          completed: false,
          priority: 'medium',
          projectId: 'learning',
          dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 45,
          position: 1,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo015',
          title: 'Practice algorithm problems',
          description: 'Solve 5 coding challenges on LeetCode',
          completed: false,
          priority: 'low',
          projectId: 'learning',
          dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 120,
          position: 2,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo016',
          title: 'Install smart thermostat',
          description: 'Replace old thermostat with programmable model',
          completed: false,
          priority: 'medium',
          projectId: 'home',
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 120,
          position: 0,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo017',
          title: 'Deep clean garage',
          description: 'Organize tools and donate unused items',
          completed: false,
          priority: 'low',
          projectId: 'home',
          dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 240,
          position: 1,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo018',
          title: 'Plan garden renovation',
          description: 'Design layout and order plants for spring',
          completed: false,
          priority: 'high',
          projectId: 'home',
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 90,
          position: 2,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo019',
          title: 'Create digital art series',
          description: 'Design 5 illustrations for portfolio',
          completed: false,
          priority: 'high',
          projectId: 'creative',
          dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 300,
          position: 0,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo020',
          title: 'Write short story',
          description: 'Complete first draft of science fiction story',
          completed: false,
          priority: 'medium',
          projectId: 'creative',
          dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 180,
          position: 1,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo021',
          title: 'Learn guitar basics',
          description: 'Practice chords and simple songs',
          completed: false,
          priority: 'low',
          projectId: 'creative',
          dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 60,
          position: 2,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo022',
          title: 'Research Japan itinerary',
          description: 'Plan 2-week trip including hotels and activities',
          completed: false,
          priority: 'medium',
          projectId: 'travel',
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 120,
          position: 0,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo023',
          title: 'Apply for travel visa',
          description: 'Submit documents for international travel',
          completed: false,
          priority: 'high',
          projectId: 'travel',
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 90,
          position: 1,
        },
      });

      dispatch({
        type: 'ADD_TODO',
        payload: {
          id: 'todo024',
          title: 'Book travel insurance',
          description: 'Compare policies and purchase coverage',
          completed: false,
          priority: 'low',
          projectId: 'travel',
          dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          duration: 45,
          position: 2,
        },
      });

      // Sample Daily Plan
      dispatch({
        type: 'SET_DAILY_PLAN',
        payload: {
          date: dateKey,
          items: [
            {
              id: 'plan001',
              title: 'Client Strategy Session',
              description: 'Quarterly business review and planning',
              type: 'event',
              start: now,
              end: oneHourLater,
              originalId: 'event001',
              completed: false,
              location: 'Executive Boardroom',
              guests: ['client@company.com', 'manager@company.com'],
              meetLink: 'https://meet.google.com/xyz-abcd-efg',
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