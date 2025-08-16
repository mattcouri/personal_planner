# Daily Organizer - Google Calendar Mirror Interface

A comprehensive calendar application that mirrors Google Calendar functionality with four distinct scheduling types: Meetings, Events (Tasks), Out of Office, and Appointment Schedules.

## Features

### 🗓️ Four Scheduling Types

1. **Meetings** - Traditional calendar events with attendees
   - Google Meet integration
   - Guest management and RSVP tracking
   - Location and description support
   - Recurring meeting patterns

2. **Events (Tasks)** - Personal tasks and to-dos
   - Task completion tracking
   - Due date management
   - Priority levels and categories
   - Integration with Google Tasks API

3. **Out of Office** - Automatic meeting management
   - Auto-decline new meeting invitations
   - Custom out-of-office messages
   - Partial day and full day options
   - Recurring vacation patterns

4. **Appointment Schedules** - Bookable time slots
   - Shareable booking pages
   - Customizable availability windows
   - Payment integration (Stripe - Demo Mode)
   - Co-host management
   - Custom booking forms

### 📅 Calendar Views
- Month view with event indicators
- Week view (7-day and 4-day)
- Day view with hourly breakdown
- Agenda view (chronological list)
- Year view for planning

### 🔐 Authentication & Integration
- Full OAuth 2.0 flow with Google Calendar API
- Real-time data synchronization
- Secure token management with automatic refresh

### 💳 Payment Integration
- Stripe integration (Demo Mode ready)
- Payment processing for appointment bookings
- Customer management
- Pricing configuration

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Google Calendar API
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe (Demo Mode)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
REACT_APP_STRIPE_SECRET_KEY=sk_test_your_key
```

### 2. Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API and Google Tasks API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/callback`
6. Copy Client ID and Client Secret to `.env`

### 3. Required OAuth Scopes

The application requests these Google API scopes:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/tasks`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

### 4. Installation & Development

```bash
npm install
npm run dev
```