// Google Calendar API Service
import { googleAuthService } from './googleAuth';
import { CalendarEvent, Task, TaskList, OutOfOfficeEvent } from '../types/calendar';

class GoogleCalendarApiService {
  private baseUrl = 'https://www.googleapis.com/calendar/v3';
  private tasksUrl = 'https://www.googleapis.com/tasks/v1';

  // Generic API request method
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    // console.log('🌐 ===== API REQUEST =====');
    // console.log('URL:', url);
    // console.log('Method:', options.method || 'GET');
    
    try {
      const accessToken = await googleAuthService.getValidAccessToken();
      // console.log('🔑 Got access token for API call');
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // console.log('📡 API Response Status:', response.status);
      // console.log('📡 API Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google Calendar API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Google Calendar API Success - Events loaded:', data.items?.length || 0);
      return data;
    } catch (error) {
      console.error('💥 Google Calendar API Request Failed:', error);
      throw error;
    }
  }

  // Calendar Management
  async getCalendarList(): Promise<any> {
    return this.makeRequest(`${this.baseUrl}/users/me/calendarList`);
  }

  async createCalendar(calendar: { summary: string; description?: string }): Promise<any> {
    return this.makeRequest(`${this.baseUrl}/calendars`, {
      method: 'POST',
      body: JSON.stringify(calendar),
    });
  }

  // Events (Meetings)
  async getEvents(
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 250
  ): Promise<{ items: CalendarEvent[] }> {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    return this.makeRequest(`${this.baseUrl}/calendars/${calendarId}/events?${params}`);
  }

  // Get all tasks from all task lists
  async getAllTasks(): Promise<{ items: Task[] }> {
    try {
      const taskListsResponse = await this.getTaskLists();
      const allTasks: Task[] = [];
      
      for (const taskList of taskListsResponse.items || []) {
        const tasksResponse = await this.getTasks(taskList.id);
        allTasks.push(...(tasksResponse.items || []));
      }
      
      return { items: allTasks };
    } catch (error) {
      console.error('Failed to get all tasks:', error);
      return { items: [] };
    }
  };

  async createEvent(calendarId: string = 'primary', event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return this.makeRequest(`${this.baseUrl}/calendars/${calendarId}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async updateEvent(
    calendarId: string = 'primary',
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    return this.makeRequest(`${this.baseUrl}/calendars/${calendarId}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<void> {
    await this.makeRequest(`${this.baseUrl}/calendars/${calendarId}/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Quick Add Event
  async quickAddEvent(calendarId: string = 'primary', text: string): Promise<CalendarEvent> {
    const params = new URLSearchParams({ text });
    return this.makeRequest(`${this.baseUrl}/calendars/${calendarId}/events/quickAdd?${params}`, {
      method: 'POST',
    });
  }

  // Tasks API
  async getTaskLists(): Promise<{ items: TaskList[] }> {
    return this.makeRequest(`${this.tasksUrl}/users/@me/lists`);
  }

  async createTaskList(taskList: { title: string }): Promise<TaskList> {
    return this.makeRequest(`${this.tasksUrl}/users/@me/lists`, {
      method: 'POST',
      body: JSON.stringify(taskList),
    });
  }

  async getTasks(taskListId: string): Promise<{ items: Task[] }> {
    // console.log(`🔍 Making API request to get tasks for list: ${taskListId}`);
    const url = `${this.tasksUrl}/lists/${taskListId}/tasks`;
    // console.log('📡 API URL:', url);
    const result = await this.makeRequest(url);
    // console.log('✅ API Response:', result);
    return result;
  }

  async createTask(taskListId: string, task: Partial<Task>): Promise<Task> {
    return this.makeRequest(`${this.tasksUrl}/lists/${taskListId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(taskListId: string, taskId: string, task: Partial<Task>): Promise<Task> {
    return this.makeRequest(`${this.tasksUrl}/lists/${taskListId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(taskListId: string, taskId: string): Promise<void> {
    await this.makeRequest(`${this.tasksUrl}/lists/${taskListId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Out of Office Events
  async createOutOfOfficeEvent(
    calendarId: string = 'primary',
    outOfOfficeEvent: Partial<OutOfOfficeEvent>
  ): Promise<OutOfOfficeEvent> {
    const event = {
      ...outOfOfficeEvent,
      eventType: 'outOfOffice' as const,
      transparency: 'opaque' as const,
      visibility: 'public' as const,
    };

    return this.makeRequest(`${this.baseUrl}/calendars/${calendarId}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async getOutOfOfficeEvents(
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string
  ): Promise<{ items: OutOfOfficeEvent[] }> {
    const params = new URLSearchParams({
      maxResults: '250',
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const response = await this.makeRequest<{ items: CalendarEvent[] }>(
      `${this.baseUrl}/calendars/${calendarId}/events?${params}`
    );

    // Filter for out-of-office events
    const outOfOfficeEvents = response.items.filter(
      event => event.eventType === 'outOfOffice'
    ) as OutOfOfficeEvent[];

    return { items: outOfOfficeEvents };
  }

  // Freebusy Query
  async getFreeBusy(
    timeMin: string,
    timeMax: string,
    calendars: string[] = ['primary']
  ): Promise<any> {
    const requestBody = {
      timeMin,
      timeMax,
      items: calendars.map(id => ({ id })),
    };

    return this.makeRequest(`${this.baseUrl}/freebusy`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  // Conference Data (Google Meet)
  async createMeetingWithConference(
    calendarId: string = 'primary',
    event: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    const eventWithConference = {
      ...event,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    return this.makeRequest(`${this.baseUrl}/calendars/${calendarId}/events?conferenceDataVersion=1`, {
      method: 'POST',
      body: JSON.stringify(eventWithConference),
    });
  }
}

export const googleCalendarApi = new GoogleCalendarApiService();