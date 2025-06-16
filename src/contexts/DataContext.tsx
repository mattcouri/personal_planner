import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, setHours, setMinutes } from 'date-fns';

// Types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  color?: string;
  location?: string;
  guests?: string[];
  meetLink?: string;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  projectId?: string;
  dueDate?: Date;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface DailyPlanItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'event' | 'todo';
  originalId: string;
  completed: boolean;
  description?: string;
  location?: string;
  guests?: string[];
  meetLink?: string;
}

export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

export interface HabitEntry {
  id: string;
  name: string;
  date: string;
  status: string;
  icon: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
}

export interface FinancialTransaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  type: 'income' | 'expense';
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  weeklyContribution: number;
}

export interface HealthScore {
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

interface AppState {
  events: CalendarEvent[];
  todos: TodoItem[];
  projects: Project[];
  dailyPlans: { [date: string]: DailyPlanItem[] };
  passwords: PasswordEntry[];
  habits: HabitEntry[];
  habitLegend: { [key: string]: { icon: string; label: string; color: string } };
  financialAccounts: FinancialAccount[];
  financialTransactions: FinancialTransaction[];
  financialGoals: FinancialGoal[];
  healthScores: HealthScore[];
}

type Action = 
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'ADD_TODO'; payload: TodoItem }
  | { type: 'UPDATE_TODO'; payload: TodoItem }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_DAILY_PLAN'; payload: { date: string; items: DailyPlanItem[] } }
  | { type: 'ADD_PASSWORD'; payload: PasswordEntry }
  | { type: 'UPDATE_PASSWORD'; payload: PasswordEntry }
  | { type: 'DELETE_PASSWORD'; payload: string }
  | { type: 'SET_HABIT'; payload: HabitEntry }
  | { type: 'UPDATE_HABIT_LEGEND'; payload: { [key: string]: { icon: string; label: string; color: string } } }
  | { type: 'ADD_FINANCIAL_ACCOUNT'; payload: FinancialAccount }
  | { type: 'UPDATE_FINANCIAL_ACCOUNT'; payload: FinancialAccount }
  | { type: 'DELETE_FINANCIAL_ACCOUNT'; payload: string }
  | { type: 'ADD_FINANCIAL_TRANSACTION'; payload: FinancialTransaction }
  | { type: 'UPDATE_FINANCIAL_TRANSACTION'; payload: FinancialTransaction }
  | { type: 'DELETE_FINANCIAL_TRANSACTION'; payload: string }
  | { type: 'ADD_FINANCIAL_GOAL'; payload: FinancialGoal }
  | { type: 'UPDATE_FINANCIAL_GOAL'; payload: FinancialGoal }
  | { type: 'DELETE_FINANCIAL_GOAL'; payload: string }
  | { type: 'SET_HEALTH_SCORE'; payload: HealthScore }
  | { type: 'LOAD_DATA'; payload: AppState };

// Create dummy data
const createDummyData = (): AppState => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const yesterday = subDays(today, 1);

  return {
    events: [
      {
        id: '1',
        title: 'Team Standup',
        start: setHours(setMinutes(today, 0), 9),
        end: setHours(setMinutes(today, 30), 9),
        description: 'Daily team sync meeting',
        color: '#3B82F6',
        location: 'Conference Room A',
        guests: ['john@company.com', 'sarah@company.com'],
        meetLink: 'https://meet.google.com/abc-defg-hij'
      },
      {
        id: '2',
        title: 'Client Presentation',
        start: setHours(setMinutes(today, 0), 14),
        end: setHours(setMinutes(today, 0), 15),
        description: 'Present Q4 results to client',
        color: '#10B981',
        location: 'Online',
        guests: ['client@company.com'],
        meetLink: 'https://meet.google.com/xyz-uvwx-yz'
      },
      {
        id: '3',
        title: 'Lunch with Sarah',
        start: setHours(setMinutes(tomorrow, 0), 12),
        end: setHours(setMinutes(tomorrow, 30), 13),
        description: 'Catch up lunch',
        color: '#F59E0B',
        location: 'Downtown Cafe, 123 Main St'
      },
      {
        id: '4',
        title: 'Doctor Appointment',
        start: setHours(setMinutes(addDays(today, 2), 0), 10),
        end: setHours(setMinutes(addDays(today, 2), 0), 11),
        description: 'Annual checkup',
        color: '#EF4444',
        location: 'Medical Center, 456 Health Ave'
      }
    ],
    todos: [
      {
        id: '1',
        title: 'Review project proposal',
        description: 'Go through the new client proposal and provide feedback',
        completed: false,
        priority: 'high',
        projectId: '2',
        dueDate: today,
        createdAt: yesterday
      },
      {
        id: '2',
        title: 'Update website content',
        description: 'Refresh the about page and add new team members',
        completed: false,
        priority: 'medium',
        projectId: '2',
        dueDate: tomorrow,
        createdAt: yesterday
      },
      {
        id: '3',
        title: 'Buy groceries',
        description: 'Milk, bread, eggs, vegetables',
        completed: true,
        priority: 'low',
        projectId: '1',
        dueDate: yesterday,
        createdAt: subDays(today, 2)
      },
      {
        id: '4',
        title: 'Call insurance company',
        description: 'Update policy information',
        completed: false,
        priority: 'medium',
        projectId: '1',
        dueDate: addDays(today, 3),
        createdAt: today
      },
      {
        id: '5',
        title: 'Prepare presentation slides',
        description: 'Create slides for client meeting',
        completed: false,
        priority: 'high',
        projectId: '2',
        dueDate: today,
        createdAt: yesterday
      }
    ],
    projects: [
      { id: '1', name: 'Personal', color: '#3B82F6', description: 'Personal tasks and goals' },
      { id: '2', name: 'Work', color: '#10B981', description: 'Professional tasks and projects' },
      { id: '3', name: 'Health & Fitness', color: '#F59E0B', description: 'Health and wellness goals' },
      { id: '4', name: 'Learning', color: '#8B5CF6', description: 'Educational and skill development' }
    ],
    dailyPlans: {},
    passwords: [
      {
        id: '1',
        name: 'Gmail',
        username: 'user@gmail.com',
        password: 'SecurePass123!',
        url: 'https://gmail.com',
        notes: 'Primary email account'
      },
      {
        id: '2',
        name: 'LinkedIn',
        username: 'professional.user',
        password: 'LinkedIn2024#',
        url: 'https://linkedin.com',
        notes: 'Professional networking'
      },
      {
        id: '3',
        name: 'Banking App',
        username: 'customer123',
        password: 'BankSecure456$',
        url: 'https://mybank.com',
        notes: 'Main checking account access'
      },
      {
        id: '4',
        name: 'Netflix',
        username: 'moviefan@email.com',
        password: 'StreamTime789%',
        url: 'https://netflix.com',
        notes: 'Family subscription'
      }
    ],
    habits: [
      { id: '1', name: 'Exercise', date: '2024-12-15', status: 'completed', icon: '✓' },
      { id: '2', name: 'Meditation', date: '2024-12-15', status: 'completed', icon: '✓' },
      { id: '3', name: 'Reading', date: '2024-12-15', status: 'partial', icon: '◐' },
      { id: '4', name: 'Water Intake', date: '2024-12-15', status: 'notCompleted', icon: '✗' },
      { id: '5', name: 'Sleep 8h', date: '2024-12-15', status: 'completed', icon: '✓' },
      { id: '6', name: 'Exercise', date: '2024-12-16', status: 'notScheduled', icon: '−' },
      { id: '7', name: 'Meditation', date: '2024-12-16', status: 'completed', icon: '✓' },
      { id: '8', name: 'Reading', date: '2024-12-16', status: 'completed', icon: '✓' },
      { id: '9', name: 'Water Intake', date: '2024-12-16', status: 'partial', icon: '◐' },
      { id: '10', name: 'Sleep 8h', date: '2024-12-16', status: 'notCompleted', icon: '✗' }
    ],
    habitLegend: {
      completed: { icon: '✓', label: 'Completed', color: '#10B981' },
      notCompleted: { icon: '✗', label: 'Not Completed', color: '#EF4444' },
      notScheduled: { icon: '−', label: 'Not Scheduled', color: '#6B7280' },
      partial: { icon: '◐', label: 'Partial', color: '#F59E0B' },
    },
    financialAccounts: [
      { id: '1', name: 'Main Checking', type: 'checking', balance: 5420.50 },
      { id: '2', name: 'Emergency Savings', type: 'savings', balance: 15000.00 },
      { id: '3', name: 'Travel Fund', type: 'savings', balance: 3200.75 },
      { id: '4', name: 'Credit Card', type: 'credit', balance: -1250.30 }
    ],
    financialTransactions: [
      {
        id: '1',
        accountId: '1',
        amount: 3500.00,
        description: 'Salary Deposit',
        category: 'Income',
        date: new Date(2024, 11, 1),
        type: 'income'
      },
      {
        id: '2',
        accountId: '1',
        amount: 1200.00,
        description: 'Rent Payment',
        category: 'Housing',
        date: new Date(2024, 11, 2),
        type: 'expense'
      },
      {
        id: '3',
        accountId: '1',
        amount: 85.50,
        description: 'Grocery Shopping',
        category: 'Food',
        date: new Date(2024, 11, 5),
        type: 'expense'
      },
      {
        id: '4',
        accountId: '2',
        amount: 500.00,
        description: 'Monthly Savings',
        category: 'Savings',
        date: new Date(2024, 11, 1),
        type: 'income'
      },
      {
        id: '5',
        accountId: '1',
        amount: 45.20,
        description: 'Gas Station',
        category: 'Transportation',
        date: new Date(2024, 11, 8),
        type: 'expense'
      }
    ],
    financialGoals: [
      {
        id: '1',
        name: 'Emergency Fund',
        targetAmount: 20000,
        currentAmount: 15000,
        deadline: new Date(2025, 5, 1),
        weeklyContribution: 200
      },
      {
        id: '2',
        name: 'New Car',
        targetAmount: 25000,
        currentAmount: 8500,
        deadline: new Date(2025, 8, 1),
        weeklyContribution: 300
      },
      {
        id: '3',
        name: 'Vacation to Europe',
        targetAmount: 5000,
        currentAmount: 3200,
        deadline: new Date(2025, 2, 1),
        weeklyContribution: 150
      }
    ],
    healthScores: [
      {
        id: '2024-11',
        month: '2024-11',
        spiritual: 7,
        mental: 6,
        social: 8,
        physical: 5,
        financial: 7,
        notes: {
          spiritual: 'Regular meditation practice helping with inner peace',
          mental: 'Some stress from work deadlines, need better work-life balance',
          social: 'Great connections with family and friends this month',
          physical: 'Need to exercise more consistently, diet is okay',
          financial: 'Staying on budget, emergency fund growing steadily'
        }
      },
      {
        id: '2024-12',
        month: '2024-12',
        spiritual: 8,
        mental: 7,
        social: 7,
        physical: 6,
        financial: 8,
        notes: {
          spiritual: 'Feeling more connected and purposeful',
          mental: 'Better stress management techniques working',
          social: 'Holiday gatherings were nice but a bit overwhelming',
          physical: 'Started new workout routine, feeling stronger',
          financial: 'Holiday spending under control, investments performing well'
        }
      }
    ]
  };
};

const initialState: AppState = createDummyData();

function dataReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return { ...state, events: state.events.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.payload) };
    case 'ADD_TODO':
      return { ...state, todos: [...state.todos, action.payload] };
    case 'UPDATE_TODO':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TODO':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.payload) };
    case 'SET_DAILY_PLAN':
      return { ...state, dailyPlans: { ...state.dailyPlans, [action.payload.date]: action.payload.items } };
    case 'ADD_PASSWORD':
      return { ...state, passwords: [...state.passwords, action.payload] };
    case 'UPDATE_PASSWORD':
      return { ...state, passwords: state.passwords.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PASSWORD':
      return { ...state, passwords: state.passwords.filter(p => p.id !== action.payload) };
    case 'SET_HABIT':
      return { ...state, habits: [...state.habits.filter(h => !(h.name === action.payload.name && h.date === action.payload.date)), action.payload] };
    case 'UPDATE_HABIT_LEGEND':
      return { ...state, habitLegend: action.payload };
    case 'ADD_FINANCIAL_ACCOUNT':
      return { ...state, financialAccounts: [...state.financialAccounts, action.payload] };
    case 'UPDATE_FINANCIAL_ACCOUNT':
      return { ...state, financialAccounts: state.financialAccounts.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_FINANCIAL_ACCOUNT':
      return { ...state, financialAccounts: state.financialAccounts.filter(a => a.id !== action.payload) };
    case 'ADD_FINANCIAL_TRANSACTION':
      return { ...state, financialTransactions: [...state.financialTransactions, action.payload] };
    case 'UPDATE_FINANCIAL_TRANSACTION':
      return { ...state, financialTransactions: state.financialTransactions.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_FINANCIAL_TRANSACTION':
      return { ...state, financialTransactions: state.financialTransactions.filter(t => t.id !== action.payload) };
    case 'ADD_FINANCIAL_GOAL':
      return { ...state, financialGoals: [...state.financialGoals, action.payload] };
    case 'UPDATE_FINANCIAL_GOAL':
      return { ...state, financialGoals: state.financialGoals.map(g => g.id === action.payload.id ? action.payload : g) };
    case 'DELETE_FINANCIAL_GOAL':
      return { ...state, financialGoals: state.financialGoals.filter(g => g.id !== action.payload) };
    case 'SET_HEALTH_SCORE':
      return { ...state, healthScores: [...state.healthScores.filter(h => h.month !== action.payload.month), action.payload] };
    case 'LOAD_DATA':
      return action.payload;
    default:
      return state;
  }
}

interface DataContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('organizer-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Convert date strings back to Date objects
        parsedData.events = parsedData.events?.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        })) || [];
        parsedData.todos = parsedData.todos?.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        })) || [];
        parsedData.financialTransactions = parsedData.financialTransactions?.map((t: any) => ({
          ...t,
          date: new Date(t.date),
        })) || [];
        parsedData.financialGoals = parsedData.financialGoals?.map((g: any) => ({
          ...g,
          deadline: new Date(g.deadline),
        })) || [];
        
        // Convert daily plan items
        if (parsedData.dailyPlans) {
          Object.keys(parsedData.dailyPlans).forEach(date => {
            parsedData.dailyPlans[date] = parsedData.dailyPlans[date].map((item: any) => ({
              ...item,
              start: new Date(item.start),
              end: new Date(item.end),
            }));
          });
        }
        
        dispatch({ type: 'LOAD_DATA', payload: { ...initialState, ...parsedData } });
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('organizer-data', JSON.stringify(state));
  }, [state]);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}