# Eventmate API

A robust RESTful API for "Eventmate," a location-based community event management system.

## Features

- **User Management**: Registration, authentication (JWT), profile management
- **Event Management**: Create, browse, search, and manage events
- **RSVP & Ticketing**: Register for events, purchase tickets for paid events
- **Admin Panel**: Moderate events, manage users, view activity logs
- **Notifications**: Send notifications to users or event attendees
- **Role-Based Access Control (RBAC)**: Visitor, Registered User, Organizer, Administrator
- **Input Validation**: All inputs validated using express-validator
- **Swagger Documentation**: Interactive API documentation

## Prerequisites

- Node.js v14+
- PostgreSQL v12+
- npm or yarn

## Installation

1. **Install dependencies**:
   ```bash
   cd back
   npm install
   ```

2. **Configure environment variables**:
   
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=eventmate
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

3. **Create the PostgreSQL database**:
   ```bash
   createdb eventmate
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```
   
   The server will automatically create tables and insert the default admin user.

## Default Admin Credentials

- Email: `admin@eventmate.com`
- Password: `admin123`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### User Profile
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update profile
- `PUT /user/password` - Change password
- `GET /user/my-events` - Get registered events

### Events
- `GET /events` - List/search events (public)
- `GET /events/:id` - Get event details
- `POST /events` - Create event (Organizer only)
- `PUT /events/:id` - Update event (Organizer only)
- `DELETE /events/:id` - Delete event (Organizer only)

### Registrations
- `POST /events/:id/rsvp` - RSVP to free event
- `POST /events/:id/purchase` - Purchase ticket for paid event

### Admin
- `GET /admin/pending-events` - List pending events
- `PATCH /admin/events/:id/status` - Approve/reject event
- `GET /admin/users` - List all users
- `PATCH /admin/users/:id/role` - Update user role
- `GET /admin/logs` - View activity logs
- `GET /admin/stats` - Get system statistics

### Notifications
- `POST /notifications/send` - Send notification
- `GET /notifications/templates` - Get notification templates

## Documentation

- **Swagger UI**: http://localhost:3000/api-docs
- **Postman Collection**: Import `Eventmate-API-Postman.json`

## Testing with Postman

1. Import the `Eventmate-API-Postman.json` file into Postman
2. Update the `baseUrl` variable if needed
3. Register a new user or login with admin credentials
4. Copy the token from login response and set it as `authToken` variable

## Database Schema

### Tables
- **users**: User accounts with roles
- **events**: Event details with location coordinates
- **registrations**: User-event registrations
- **tickets**: Ticket purchases for paid events
- **notifications**: User notifications
- **activity_logs**: System activity tracking

## Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation on all endpoints
- SQL injection prevention via parameterized queries

## License

ISC
