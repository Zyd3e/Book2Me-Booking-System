# Architecture & Design Document

## System Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────┐
│   Presentation Layer (Frontend)     │
│   React + React Router + Tailwind   │
└────────────────────┬────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────┴────────────────┐
│   Application Layer (Backend)       │
│   Flask + SQLAlchemy + JWT         │
└────────────────────┬────────────────┘
                     │
                     │ SQL
                     │
┌────────────────────┴────────────────┐
│   Data Layer (Database)             │
│   MySQL                             │
└─────────────────────────────────────┘
```

## Component Breakdown

### Backend Structure

#### Models (app/models/__init__.py)
- **User**: User accounts with role-based access
- **Room**: Hotel rooms with availability
- **Hall**: Event spaces/halls
- **RoomBooking**: Room reservation records
- **HallBooking**: Hall/event reservation records
- **StaffProfile**: Employee information
- **Shift**: Staff shift assignments
- **Attendance**: Staff attendance tracking

#### Routes/Blueprints (app/routes/)
- **auth.py**: Registration, login, authentication
- **rooms.py**: Room CRUD and search endpoints
- **halls.py**: Hall CRUD and search endpoints
- **bookings.py**: Booking creation, management, cancellation
- **admin.py**: Analytics, user management, dashboard
- **hr.py**: Staff management, shifts, attendance, payroll

#### Utilities (app/utils/)
- **decorators.py**: @token_required, @admin_required, @hr_required
- **validators.py**: Email, password, date validation

### Frontend Structure

#### Pages
- **LoginPage**: User authentication
- **RegisterPage**: New account creation
- **CustomerPortal/**:
  - RoomsPage: Browse available rooms
  - BookRoomPage: Booking form
  - HallsPage: Browse event halls
  - BookingsPage: View bookings history
- **AdminDashboard/**:
  - DashboardPage: Analytics and overview
  - ManageRoomsPage: Room inventory management
  - ManageHallsPage: Hall inventory management
  - BookingsManagementPage: Booking administration
- **HRModule/**:
  - StaffPage: Staff management

#### State Management (Zustand)
- **useAuthStore**: User authentication state
- **useBookingStore**: Booking data and selections

---

## Security Implementation

### Authentication & Authorization

1. **JWT Tokens**
   - Issued on successful login
   - Stored in localStorage
   - Included in all API requests
   - Verified on backend

2. **Role-Based Access Control**
   - Customer: Browse, book, view own bookings
   - Admin: Full system management
   - HR Manager: Staff and payroll management

3. **Password Security**
   - Bcrypt hashing (handled by Flask)
   - Minimum 8 characters, uppercase, digit required
   - Never stored in plain text

4. **Data Validation**
   - Server-side validation on all inputs
   - Email format verification
   - Date range checking
   - Numeric range validation

### CORS & API Security
- CORS enabled for frontend domain
- All routes require authentication (except login/register)
- Role-based endpoint protection
- Rate limiting ready (can be added)

---

## Database Design

### Entity Relationships

```
Users (1) ──→ (M) RoomBookings
Users (1) ──→ (M) HallBookings
Users (1) ──→ (1) StaffProfile
Rooms (1) ──→ (M) RoomBookings
Halls (1) ──→ (M) HallBookings
StaffProfile (1) ──→ (M) Shifts
StaffProfile (1) ──→ (M) Attendance
```

### Key Constraints
- Email is unique per user
- Room number and hall name are unique
- Employee ID is unique
- Foreign keys ensure referential integrity
- ON DELETE CASCADE for cascading deletes

---

## API Design

### RESTful Principles

| Method | Resource | Action |
|--------|----------|--------|
| GET | /api/rooms | List all rooms |
| GET | /api/rooms/1 | Get room details |
| POST | /api/rooms | Create room (admin) |
| PUT | /api/rooms/1 | Update room (admin) |
| DELETE | /api/rooms/1 | Delete room (admin) |

### Response Format

**Success (200, 201)**
```json
{
  "message": "Operation successful",
  "data": { ... },
  "user": { ... }
}
```

**Error (400, 401, 403, 404, 500)**
```json
{
  "error": "Error description"
}
```

---

## Booking System Logic

### Room Booking Flow
1. Customer browses available rooms with filters
2. Selects check-in and check-out dates
3. System checks for conflicts
4. Creates booking with PENDING status
5. Admin confirms or rejects
6. Customer can cancel if PENDING/CONFIRMED

### Hall Booking Flow
1. Similar to room booking
2. Additional: Select event date and time range
3. Check for time slot conflicts
4. Calculate price based on duration

### Availability Checking
- Query existing bookings for date range
- Exclude CANCELLED bookings
- Filter active properties only

---

## Scalability Considerations

### Database
- Add indexing on frequently queried columns ✓
- Use connection pooling (pgbounce, ProxySQL)
- Consider read replicas for analytics
- Archive old bookings periodically

### API
- Implement caching (Redis)
- Rate limiting per IP/user
- Pagination for list endpoints
- Compression (gzip)

### Frontend
- Code splitting by route
- Lazy loading
- Image optimization
- Service workers for offline support

---

## Monitoring & Logging

### Backend Logging
- All API requests with timestamps
- Error stack traces
- Authentication events
- Database query logs

### Frontend Monitoring
- Error tracking (Sentry)
- Performance metrics
- User session tracking
- API response times

---

## Deployment Architecture

### Development
```
localhost:3000 → localhost:5000 → localhost:3306
```

### Production
```
CDN → Frontend (Vercel/Netlify)
         ↓
    Backend (Docker/VPS)
         ↓
    Database (Managed MySQL)
```

### Docker Setup (Optional)
```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]

# Frontend Dockerfile
FROM node:16 AS build
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Performance Optimization

### Backend
- Database connection pooling
- Query optimization with proper indexing
- Caching frequently accessed data
- Async task processing (Celery)

### Frontend
- Code splitting by route
- Lazy loading components
- Image optimization
- CSS/JS minification

### Database
- Query optimization
- Proper indexing strategy
- Regular maintenance
- Incremental backups

---

## Testing Strategy

### Unit Tests
```python
# Backend: pytest
def test_room_creation():
    room = create_test_room()
    assert room.room_number == "101"

# Frontend: Jest
test('renders login form', () => {
  render(<LoginPage />);
  expect(screen.getByText('Login')).toBeInTheDocument();
});
```

### Integration Tests
- Test API endpoint chains
- Test component interactions

### E2E Tests
- Selenium/Puppeteer
- User workflow testing
- Cross-browser testing

---

## Future Enhancements

1. **Payment Integration**
   - Stripe/PayPal
   - Invoice generation
   - Payment receipts

2. **Notifications**
   - Email confirmations
   - SMS alerts
   - Push notifications

3. **Analytics**
   - Advanced reporting
   - BI dashboards
   - Occupancy forecasting

4. **Mobile App**
   - React Native
   - Offline capabilities

5. **Advanced Features**
   - Multi-language support
   - Calendar integrations
   - Automated emails
   - Review/rating system
