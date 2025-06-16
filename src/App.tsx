import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <DragDropProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<DailyPlan />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/todos" element={<TodoList />} />
                <Route path="/passwords" element={<Passwords />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/health" element={<Health />} />
              </Routes>
            </Layout>
          </Router>
        </DragDropProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;