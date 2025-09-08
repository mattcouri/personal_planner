// contexts/DataContext.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { localStorageService } from '../services/localStorageService';

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
  goals: any[];
  passwords: any[];
  habits: any[];
  habitLegend: Record<string, { icon: string; label: string; color: string }>;
  healthDimensions: any[];
  financialAccounts: any[];
  financialTransactions: any[];
  financialGoals: any[];
  healthScores: any[];
  completedTasks: any[];
  archivedItems: any[];
  userPreferences: {
    theme: string;
    defaultView: string;
    notifications: boolean;
  };
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
  | { type: 'SET_HEALTH_SCORE'; payload: any }
  | { type: 'ADD_GOAL'; payload: any }
  | { type: 'UPDATE_GOAL'; payload: any }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_HEALTH_DIMENSION'; payload: any }
  | { type: 'UPDATE_HEALTH_DIMENSION'; payload: any }
  | { type: 'DELETE_HEALTH_DIMENSION'; payload: string }
  | { type: 'ADD_PASSWORD'; payload: any }
  | { type: 'UPDATE_PASSWORD'; payload: any }
  | { type: 'DELETE_PASSWORD'; payload: string }
  | { type: 'ADD_FINANCIAL_ACCOUNT'; payload: any }
  | { type: 'UPDATE_FINANCIAL_ACCOUNT'; payload: any }
  | { type: 'DELETE_FINANCIAL_ACCOUNT'; payload: string }
  | { type: 'ADD_FINANCIAL_TRANSACTION'; payload: any }
  | { type: 'UPDATE_FINANCIAL_TRANSACTION'; payload: any }
  | { type: 'DELETE_FINANCIAL_TRANSACTION'; payload: string }
  | { type: 'ADD_FINANCIAL_GOAL'; payload: any }
  | { type: 'UPDATE_FINANCIAL_GOAL'; payload: any }
  | { type: 'DELETE_FINANCIAL_GOAL'; payload: string }
  | { type: 'COMPLETE_TODO'; payload: string }
  | { type: 'ARCHIVE_ITEM'; payload: any }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: any }
  | { type: 'LOAD_DATA'; payload: any };

// Initialize with data from localStorage
const getInitialState = (): AppState => {
  const savedData = localStorageService.loadData();
  
  return {
    events: [],
    todos: savedData.todos || [],
    dailyPlans: savedData.dailyPlans || {},
    projects: savedData.projects || [],
    goals: savedData.goals || [],
    passwords: savedData.passwords || [],
    habits: savedData.habits || [],
    habitLegend: savedData.habitLegend || {},
    healthDimensions: savedData.healthDimensions || [],
    financialAccounts: savedData.financialAccounts || [],
    financialTransactions: savedData.financialTransactions.map(t => ({
      ...t,
      date: new Date(t.date)
    })) || [],
    financialGoals: savedData.financialGoals.map(g => ({
      ...g,
      deadline: new Date(g.deadline)
    })) || [],
    healthScores: savedData.healthScores || [],
    completedTasks: savedData.completedTasks || [],
    archivedItems: savedData.archivedItems || [],
    userPreferences: savedData.userPreferences || {
      theme: 'light',
      defaultView: 'week',
      notifications: true
    }
  };
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
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
      
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
      
    case 'COMPLETE_TODO':
      const completedTodo = state.todos.find(todo => todo.id === action.payload);
      if (completedTodo) {
        return {
          ...state,
          todos: state.todos.filter(todo => todo.id !== action.payload),
          completedTasks: [...state.completedTasks, { ...completedTodo, completedAt: new Date().toISOString() }]
        };
      }
      return state;
      
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
      
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
      
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id ? action.payload : goal
        ),
      };
      
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(goal => goal.id !== action.payload),
      };
      
    case 'ADD_HEALTH_DIMENSION':
      return { ...state, healthDimensions: [...state.healthDimensions, action.payload] };
      
    case 'UPDATE_HEALTH_DIMENSION':
      return {
        ...state,
        healthDimensions: state.healthDimensions.map(dimension =>
          dimension.id === action.payload.id ? action.payload : dimension
        ),
      };
      
    case 'DELETE_HEALTH_DIMENSION':
      return {
        ...state,
        healthDimensions: state.healthDimensions.filter(dimension => dimension.id !== action.payload),
      };
      
    case 'ADD_PASSWORD':
      return { ...state, passwords: [...state.passwords, action.payload] };
      
    case 'UPDATE_PASSWORD':
      return {
        ...state,
        passwords: state.passwords.map(password =>
          password.id === action.payload.id ? action.payload : password
        ),
      };
      
    case 'DELETE_PASSWORD':
      return {
        ...state,
        passwords: state.passwords.filter(password => password.id !== action.payload),
      };
      
    case 'ADD_FINANCIAL_ACCOUNT':
      return { ...state, financialAccounts: [...state.financialAccounts, action.payload] };
      
    case 'UPDATE_FINANCIAL_ACCOUNT':
      return {
        ...state,
        financialAccounts: state.financialAccounts.map(account =>
          account.id === action.payload.id ? action.payload : account
        ),
      };
      
    case 'DELETE_FINANCIAL_ACCOUNT':
      return {
        ...state,
        financialAccounts: state.financialAccounts.filter(account => account.id !== action.payload),
      };
      
    case 'ADD_FINANCIAL_TRANSACTION':
      return { ...state, financialTransactions: [...state.financialTransactions, action.payload] };
      
    case 'UPDATE_FINANCIAL_TRANSACTION':
      return {
        ...state,
        financialTransactions: state.financialTransactions.map(transaction =>
          transaction.id === action.payload.id ? action.payload : transaction
        ),
      };
      
    case 'DELETE_FINANCIAL_TRANSACTION':
      return {
        ...state,
        financialTransactions: state.financialTransactions.filter(transaction => transaction.id !== action.payload),
      };
      
    case 'ADD_FINANCIAL_GOAL':
      return { ...state, financialGoals: [...state.financialGoals, action.payload] };
      
    case 'UPDATE_FINANCIAL_GOAL':
      return {
        ...state,
        financialGoals: state.financialGoals.map(goal =>
          goal.id === action.payload.id ? action.payload : goal
        ),
      };
      
    case 'DELETE_FINANCIAL_GOAL':
      return {
        ...state,
        financialGoals: state.financialGoals.filter(goal => goal.id !== action.payload),
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
      
    case 'ARCHIVE_ITEM':
      return {
        ...state,
        archivedItems: [...state.archivedItems, action.payload]
      };
      
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, ...action.payload }
      };
      
    default:
      return state;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    // Prepare data for saving (convert dates to ISO strings)
    const dataToSave = {
      todos: state.todos,
      projects: state.projects,
      dailyPlans: state.dailyPlans,
      goals: state.goals,
      healthScores: state.healthScores,
      healthDimensions: state.healthDimensions,
      habits: state.habits,
      habitLegend: state.habitLegend,
      financialAccounts: state.financialAccounts,
      financialTransactions: state.financialTransactions.map(t => ({
        ...t,
        date: t.date.toISOString()
      })),
      financialGoals: state.financialGoals.map(g => ({
        ...g,
        deadline: g.deadline.toISOString()
      })),
      passwords: state.passwords,
      completedTasks: state.completedTasks,
      archivedItems: state.archivedItems,
      userPreferences: state.userPreferences
    };
    
    // Save to localStorage with enhanced service
    localStorageService.saveData(dataToSave);
  }, [state]);

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