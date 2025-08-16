// Calendar Types
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: EventAttendee[];
  conferenceData?: ConferenceData;
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  transparency?: 'opaque' | 'transparent';
  status?: 'confirmed' | 'tentative' | 'cancelled';
  eventType?: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation';
  guestsCanModify?: boolean;
  guestsCanInviteOthers?: boolean;
  guestsCanSeeOtherGuests?: boolean;
  created?: string;
  updated?: string;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
}

export interface EventAttendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
  organizer?: boolean;
  self?: boolean;
  additionalGuests?: number;
}

export interface ConferenceData {
  createRequest?: {
    requestId: string;
    conferenceSolutionKey: {
      type: 'hangoutsMeet' | 'addOn';
    };
  };
  entryPoints?: Array<{
    entryPointType: 'video' | 'phone' | 'sip' | 'more';
    uri: string;
    label?: string;
    pin?: string;
    accessCode?: string;
    meetingCode?: string;
    passcode?: string;
    password?: string;
  }>;
  conferenceSolution?: {
    key: {
      type: string;
    };
    name: string;
    iconUri?: string;
  };
  conferenceId?: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  deleted?: boolean;
  hidden?: boolean;
  parent?: string;
  position: string;
  updated: string;
  selfLink: string;
  kind: string;
  etag: string;
  links?: Array<{
    type: string;
    description: string;
    link: string;
  }>;
}

export interface TaskList {
  id: string;
  title: string;
  updated: string;
  selfLink: string;
  kind: string;
  etag: string;
}

export interface OutOfOfficeEvent extends CalendarEvent {
  eventType: 'outOfOffice';
  outOfOfficeProperties?: {
    autoDeclineMode: 'declineOnlyIfAtLeastOneEventConflicts' | 'declineAllConflictingInvitations';
    declineMessage?: string;
  };
}

export interface AppointmentSchedule {
  id: string;
  title: string;
  description?: string;
  duration: number; // minutes
  bufferTime: number; // minutes
  maxBookingsPerDay?: number;
  advanceBookingDays: number;
  availableTimeSlots: TimeSlot[];
  bookingForm: BookingFormField[];
  paymentRequired: boolean;
  price?: number;
  currency?: string;
  coHosts: string[];
  isActive: boolean;
  bookingPageUrl: string;
  created: string;
  updated: string;
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface BookingFormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[]; // for select fields
  placeholder?: string;
}

export interface Booking {
  id: string;
  scheduleId: string;
  bookerName: string;
  bookerEmail: string;
  bookerPhone?: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  formResponses: Record<string, any>;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentIntentId?: string;
  created: string;
  updated: string;
}

export type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'year' | '4days';

export type SchedulingType = 'meetings' | 'events' | 'outOfOffice' | 'appointments';

export interface CalendarState {
  currentView: CalendarView;
  currentDate: Date;
  selectedDate: Date | null;
  activeSchedulingType: SchedulingType;
  events: CalendarEvent[];
  tasks: Task[];
  taskLists: TaskList[];
  outOfOfficeEvents: OutOfOfficeEvent[];
  appointmentSchedules: AppointmentSchedule[];
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
}

export interface RecurrencePattern {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  byDay?: string[]; // MO, TU, WE, TH, FR, SA, SU
  byMonthDay?: number[];
  byMonth?: number[];
  until?: string; // ISO date string
  count?: number;
}