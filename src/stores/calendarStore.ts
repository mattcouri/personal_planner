// Calendar Store using Zustand
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  CalendarState, 
  CalendarView, 
  SchedulingType, 
  CalendarEvent, 
  Task, 
  TaskList,
  OutOfOfficeEvent,
  AppointmentSchedule,
  Booking
} from '../types/calendar';

interface CalendarActions {
  // View and Navigation
  setCurrentView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  setActiveSchedulingType: (type: SchedulingType) => void;
  navigateDate: (direction: 'prev' | 'next') => void;
  goToToday: () => void;

  // Events (Meetings)
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;

  // Tasks
  setTasks: (tasks: Task[]) => void;
  setTaskLists: (taskLists: TaskList[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;

  // Out of Office
  setOutOfOfficeEvents: (events: OutOfOfficeEvent[]) => void;
  addOutOfOfficeEvent: (event: OutOfOfficeEvent) => void;
  updateOutOfOfficeEvent: (eventId: string, updates: Partial<OutOfOfficeEvent>) => void;
  deleteOutOfOfficeEvent: (eventId: string) => void;

  // Appointment Schedules
  setAppointmentSchedules: (schedules: AppointmentSchedule[]) => void;
  addAppointmentSchedule: (schedule: AppointmentSchedule) => void;
  updateAppointmentSchedule: (scheduleId: string, updates: Partial<AppointmentSchedule>) => void;
  deleteAppointmentSchedule: (scheduleId: string) => void;

  // Bookings
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  cancelBooking: (bookingId: string) => void;

  // Loading and Error States
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const getDateIncrement = (view: CalendarView): number => {
  switch (view) {
    case 'day': return 1;
    case '4days': return 4;
    case 'week': return 7;
    case 'month': return 30;
    case 'year': return 365;
    default: return 1;
  }
};

export const useCalendarStore = create<CalendarState & CalendarActions>()(
  devtools(
    (set, get) => ({
      // Initial State
      currentView: 'week',
      currentDate: new Date(),
      selectedDate: null,
      activeSchedulingType: 'meetings',
      events: [
        // Add some sample events for testing
        {
          id: 'sample-1',
          summary: 'Team Meeting',
          description: 'Weekly team sync',
          start: {
            dateTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          location: 'Conference Room A',
          attendees: [
            { email: 'john@company.com', displayName: 'John Doe' }
          ]
        },
        {
          id: 'sample-2',
          summary: 'Client Call',
          description: 'Quarterly review with client',
          start: {
            dateTime: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          location: 'Zoom',
          attendees: [
            { email: 'client@company.com', displayName: 'Client Name' }
          ]
        },
        {
          id: 'sample-3',
          summary: 'Lunch Break',
          start: {
            dateTime: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      ],
      tasks: [],
      taskLists: [],
      outOfOfficeEvents: [],
      appointmentSchedules: [],
      bookings: [],
      isLoading: false,
      error: null,

      // View and Navigation Actions
      setCurrentView: (view) => set({ currentView: view }),
      setCurrentDate: (date) => set({ currentDate: date }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setActiveSchedulingType: (type) => set({ activeSchedulingType: type }),

      navigateDate: (direction) => {
        const { currentView, currentDate } = get();
        const increment = getDateIncrement(currentView);
        const multiplier = direction === 'next' ? 1 : -1;
        const newDate = new Date(currentDate);
        
        if (currentView === 'month') {
          newDate.setMonth(newDate.getMonth() + multiplier);
        } else if (currentView === 'year') {
          newDate.setFullYear(newDate.getFullYear() + multiplier);
        } else {
          newDate.setDate(newDate.getDate() + (increment * multiplier));
        }
        
        set({ currentDate: newDate });
      },

      goToToday: () => set({ currentDate: new Date(), selectedDate: new Date() }),

      // Events Actions
      setEvents: (events) => set({ events }),
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      updateEvent: (eventId, updates) => set((state) => ({
        events: state.events.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        )
      })),
      deleteEvent: (eventId) => set((state) => ({
        events: state.events.filter(event => event.id !== eventId)
      })),

      // Tasks Actions
      setTasks: (tasks) => set({ tasks }),
      setTaskLists: (taskLists) => set({ taskLists }),
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (taskId, updates) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      })),
      deleteTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== taskId)
      })),
      toggleTaskCompletion: (taskId) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: task.status === 'completed' ? 'needsAction' : 'completed',
                completed: task.status === 'completed' ? undefined : new Date().toISOString()
              } 
            : task
        )
      })),

      // Out of Office Actions
      setOutOfOfficeEvents: (events) => set({ outOfOfficeEvents: events }),
      addOutOfOfficeEvent: (event) => set((state) => ({ 
        outOfOfficeEvents: [...state.outOfOfficeEvents, event] 
      })),
      updateOutOfOfficeEvent: (eventId, updates) => set((state) => ({
        outOfOfficeEvents: state.outOfOfficeEvents.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        )
      })),
      deleteOutOfOfficeEvent: (eventId) => set((state) => ({
        outOfOfficeEvents: state.outOfOfficeEvents.filter(event => event.id !== eventId)
      })),

      // Appointment Schedules Actions
      setAppointmentSchedules: (schedules) => set({ appointmentSchedules: schedules }),
      addAppointmentSchedule: (schedule) => set((state) => ({ 
        appointmentSchedules: [...state.appointmentSchedules, schedule] 
      })),
      updateAppointmentSchedule: (scheduleId, updates) => set((state) => ({
        appointmentSchedules: state.appointmentSchedules.map(schedule => 
          schedule.id === scheduleId ? { ...schedule, ...updates } : schedule
        )
      })),
      deleteAppointmentSchedule: (scheduleId) => set((state) => ({
        appointmentSchedules: state.appointmentSchedules.filter(schedule => schedule.id !== scheduleId)
      })),

      // Bookings Actions
      setBookings: (bookings) => set({ bookings }),
      addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
      updateBooking: (bookingId, updates) => set((state) => ({
        bookings: state.bookings.map(booking => 
          booking.id === bookingId ? { ...booking, ...updates } : booking
        )
      })),
      cancelBooking: (bookingId) => set((state) => ({
        bookings: state.bookings.map(booking => 
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      })),

      // Loading and Error Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'calendar-store',
    }
  )
);