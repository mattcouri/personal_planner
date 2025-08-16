import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StripeProvider } from './components/Stripe/StripeProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import DragDropProvider from './components/DragDropProvider';
import Layout from './components/Layout';
import DailyPlan from './pages/DailyPlan';
import Calendar from './pages/Calendar';
import TodoList from './pages/TodoList';
import Passwords from './pages/Passwords';
import Habits from './pages/Habits';
import Financial from './pages/Financial';
import Health from './pages/Health';
import CompletedTasks from './pages/CompletedTasks';
import HealthDimensionDetail from './pages/HealthDimensionDetail';
import AuthCallback from './components/Auth/AuthCallback';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <DragDropProvider>
          <Router>
            <StripeProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<DailyPlan />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/todos" element={<TodoList />} />
                  <Route path="/passwords" element={<Passwords />} />
                  <Route path="/habits" element={<Habits />} />
                  <Route path="/financial" element={<Financial />} />
                  <Route path="/health" element={<Health />} />
                  <Route path="/health/:dimensionId" element={<HealthDimensionDetail />} />
                  <Route path="/completed-tasks" element={<CompletedTasks />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                </Routes>
              </Layout>
            </StripeProvider>
          </Router>
        </DragDropProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;