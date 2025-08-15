import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  dueDate?: Date;
  createdAt: Date;
  duration?: number;
  position: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  position: number;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  createdAt: Date;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  position: number;
  createdAt: Date;
}

export interface HealthDimension {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  createdAt: Date;
}

export interface AppState {
  todos: Todo[];
  projects: Project[];
  goals: Goal[];
  habits: Habit[];
  healthDimensions: HealthDimension[];
}

// Actions
type Action =
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'UPDATE_TODO'; payload: Todo }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'ADD_HEALTH_DIMENSION'; payload: HealthDimension }
  | { type: 'UPDATE_HEALTH_DIMENSION'; payload: HealthDimension }
  | { type: 'DELETE_HEALTH_DIMENSION'; payload: string };

// Initial state with Unclassified project
const initialState: AppState = {
  todos: [],
  projects: [
    {
      id: 'unclassified',
      name: 'Unclassified',
      color: 'gray',
      createdAt: new Date(),
      position: 0,
    }
  ],
  goals: [],
  habits: [],
  healthDimensions: [],
};

// Reducer
function dataReducer(state: AppState, action: Action): AppState {
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
      // Don't allow deleting the Unclassified project
      if (action.payload === 'unclassified') {
        return state;
      }
      
      // Move todos from deleted project to Unclassified
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
        habits: [...state.habits, action.payload],
      };
    
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(habit =>
          habit.id === action.payload.id ? action.payload : habit
        ),
      };
    
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter(habit => habit.id !== action.payload),
      };
    
    case 'ADD_HEALTH_DIMENSION':
      return {
        ...state,
        healthDimensions: [...state.healthDimensions, action.payload],
      };
    
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
    
    default:
      return state;
  }
}

// Context
const DataContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

// Provider
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

// Hook
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}