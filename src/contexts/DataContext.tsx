import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  dueDate: Date;
  createdAt: Date;
  duration?: number;
  position: number;
}

interface Project {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color: string;
  location?: string;
  guests?: string[];
  meetLink?: string;
}

interface Password {
  id: string;
  name: string;
  username: string;
  password: string;
  pin?: string;
  url?: string;
  description?: string;
  notes?: string;
}

interface Goal {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  habits: Habit[];
}

interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  schedule: {
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
  };
  startDate: Date;
  endDate?: Date;
  completions: Record<string, 'completed' | 'skipped' | 'missed'>;
  onTime: Record<string, boolean>;
  position: number;
}

interface HealthScore {
  id: string;
  month: string;
  spiritual: number;
  mental: number;
  social: number;
  physical: number;
  financial: number;
  notes: {
    spiritual: string;
    mental: string;
    social: string;
    physical: string;
    financial: string;
  };
}

interface FinancialAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
}

interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  accountId: string;
}

interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  weeklyContribution: number;
}

interface AppState {
  todos: Todo[];
  projects: Project[];
  events: Event[];
  passwords: Password[];
  goals: Goal[];
  healthScores: HealthScore[];
  financialAccounts: FinancialAccount[];
  financialTransactions: FinancialTransaction[];
  financialGoals: FinancialGoal[];
  dailyPlans: Record<string, any[]>;
}

type AppAction =
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'UPDATE_TODO'; payload: Todo }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'MOVE_TODO_TO_PROJECT'; payload: { todoId: string; newProjectId: string; newPosition: number } }
  | { type: 'REORDER_TODOS'; payload: { projectId: string; todos: Todo[] } }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_HABIT'; payload: { goalId: string; habit: Habit } }
  | { type: 'UPDATE_HABIT'; payload: { goalId: string; habit: Habit } }
  | { type: 'DELETE_HABIT'; payload: { goalId: string; habitId: string } }
  | { type: 'SET_HEALTH_SCORE'; payload: HealthScore }
  | { type: 'SET_DAILY_PLAN'; payload: { date: string; items: any[] } };

// Initial state with Unclassified project
const initialState: AppState = {
  todos: [
    {
      id: 'todo1',
      title: 'Review quarterly reports',
      description: 'Go through Q3 financial reports and prepare summary',
      completed: false,
      priority: 'high',
      projectId: 'unclassified',
      dueDate: new Date(2025, 0, 20),
      createdAt: new Date(),
      duration: 120,
      position: 0,
    },
    {
      id: 'todo2',
      title: 'Team standup meeting',
      description: 'Daily sync with development team',
      completed: false,
      priority: 'medium',
      projectId: 'unclassified',
      dueDate: new Date(2025, 0, 16),
      createdAt: new Date(),
      duration: 30,
      position: 1,
    },
    {
      id: 'todo3',
      title: 'Update project documentation',
      description: 'Add new API endpoints to documentation',
      completed: true,
      priority: 'low',
      projectId: 'unclassified',
      dueDate: new Date(2025, 0, 15),
      createdAt: new Date(),
      duration: 60,
      position: 2,
    },
  ],
  projects: [
    { id: 'unclassified', name: 'Unclassified' },
    { id: 'work', name: 'Work Projects' },
    { id: 'personal', name: 'Personal' },
  ],
  events: [
    {
      id: 'event1',
      title: 'Team Meeting',
      description: 'Weekly team sync',
      start: new Date(2025, 0, 16, 10, 0),
      end: new Date(2025, 0, 16, 11, 0),
      color: '#3B82F6',
      location: 'Conference Room A',
      guests: ['john@example.com', 'jane@example.com'],
    },
    {
      id: 'event2',
      title: 'Client Presentation',
      description: 'Present Q4 results to client',
      start: new Date(2025, 0, 17, 14, 0),
      end: new Date(2025, 0, 17, 15, 30),
      color: '#EF4444',
      location: 'Client Office',
      meetLink: 'https://meet.google.com/abc-defg-hij',
    },
  ],
  passwords: [
    {
      id: 'pwd001',
      name: 'Gmail',
      username: 'user@gmail.com',
      password: 'SecurePass123!',
      pin: '1234',
      url: 'https://gmail.com',
      description: 'Primary email account',
    },
    {
      id: 'pwd002',
      name: 'Netflix',
      username: 'user@example.com',
      password: 'MovieTime456@',
      pin: '5678',
      url: 'https://netflix.com',
      description: 'Streaming service',
    },
  ],
  goals: [
    {
      id: 'goal1',
      name: 'Physical Health',
      description: 'Improve overall physical fitness and health',
      color: '#F59E0B',
      position: 1,
      habits: [
        {
          id: 'habit1',
          name: 'Morning Run',
          description: '30-minute jog around the neighborhood',
          color: '#EF4444',
          icon: '🏃',
          schedule: {
            sunday: false,
            monday: true,
            tuesday: false,
            wednesday: true,
            thursday: false,
            friday: true,
            saturday: false,
          },
          startDate: new Date(2025, 0, 1),
          completions: {
            '2025-01-13': 'completed',
            '2025-01-15': 'completed',
          },
          onTime: {
            '2025-01-13': true,
            '2025-01-15': false,
          },
          position: 0,
        },
      ],
    },
  ],
  healthScores: [
    {
      id: '2025-01',
      month: '2025-01',
      spiritual: 7,
      mental: 6,
      social: 8,
      physical: 5,
      financial: 7,
      notes: {
        spiritual: 'Regular meditation practice',
        mental: 'Some stress from work',
        social: 'Good connections with friends',
        physical: 'Need more exercise',
        financial: 'Staying on budget',
      },
    },
  ],
  financialAccounts: [
    { id: 'acc1', name: 'Main Checking', type: 'checking', balance: 5420 },
    { id: 'acc2', name: 'Savings Account', type: 'savings', balance: 12800 },
    { id: 'acc3', name: 'Credit Card', type: 'credit', balance: -1250 },
  ],
  financialTransactions: [
    {
      id: 'txn1',
      description: 'Salary Deposit',
      amount: 4500,
      type: 'income',
      category: 'Salary',
      date: new Date(2025, 0, 1),
      accountId: 'acc1',
    },
    {
      id: 'txn2',
      description: 'Grocery Shopping',
      amount: 120,
      type: 'expense',
      category: 'Food',
      date: new Date(2025, 0, 5),
      accountId: 'acc1',
    },
  ],
  financialGoals: [
    {
      id: 'fgoal1',
      name: 'Emergency Fund',
      targetAmount: 15000,
      currentAmount: 8500,
      deadline: new Date(2025, 11, 31),
      weeklyContribution: 200,
    },
  ],
  dailyPlans: {},
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, action.payload],
      };

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

    case 'MOVE_TODO_TO_PROJECT':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.todoId
            ? { ...todo, projectId: action.payload.newProjectId, position: action.payload.newPosition }
            : todo
        ),
      };

    case 'REORDER_TODOS':
      return {
        ...state,
        todos: state.todos.map(todo => {
          const updatedTodo = action.payload.todos.find(t => t.id === todo.id);
          return updatedTodo || todo;
        }),
      };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
      };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
      };

    case 'DELETE_PROJECT':
      // Don't allow deleting the unclassified project
      if (action.payload === 'unclassified') {
        return state;
      }
      
      // Move todos from deleted project to unclassified
      const updatedTodos = state.todos.map(todo =>
        todo.projectId === action.payload
          ? { ...todo, projectId: 'unclassified' }
          : todo
      );

      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        todos: updatedTodos,
      };

    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload],
      };

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        ),
      };

    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
      };

    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, action.payload],
      };

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

    case 'ADD_HABIT':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.goalId
            ? { ...goal, habits: [...goal.habits, action.payload.habit] }
            : goal
        ),
      };

    case 'UPDATE_HABIT':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.goalId
            ? {
                ...goal,
                habits: goal.habits.map(habit =>
                  habit.id === action.payload.habit.id ? action.payload.habit : habit
                ),
              }
            : goal
        ),
      };

    case 'DELETE_HABIT':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.goalId
            ? {
                ...goal,
                habits: goal.habits.filter(habit => habit.id !== action.payload.habitId),
              }
            : goal
        ),
      };

    case 'SET_HEALTH_SCORE':
      return {
        ...state,
        healthScores: state.healthScores.some(score => score.id === action.payload.id)
          ? state.healthScores.map(score =>
              score.id === action.payload.id ? action.payload : score
            )
          : [...state.healthScores, action.payload],
      };

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

// Context
const DataContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

// Custom hook
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}