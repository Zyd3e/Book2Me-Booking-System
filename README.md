# Book2Me - Hotel Management SaaS

A comprehensive full-stack hotel management system built with React, Flask, and MySQL. Manage rooms, event halls, bookings, and staff through three specialized portals.

## Features

### Customer Portal
- Browse available rooms with advanced filtering (date, type, capacity, price)
- Make and manage room bookings
- Browse and book event halls/spaces
- View booking history and status
- Special booking requests

### Admin Dashboard
- Manage room inventory (add, edit, delete, set availability)
- Manage event halls (add, edit, delete)
- View and manage all bookings (rooms and halls)
- Revenue analytics and occupancy reports
- User management

### HR/Staff Module
- Staff profile management (add, edit, deactivate)
- Shift assignment and tracking
- Attendance management and records
- Payroll summary view with attendance analytics

## Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Zustand** - State management
- **Recharts** - Analytics charts
- **Vite** - Build tool

### Backend
- **Flask** - Web framework
- **Flask-SQLAlchemy** - ORM
- **Flask-JWT-Extended** - Authentication
- **PyMySQL** - MySQL driver
- **python-dotenv** - Environment configuration

### Database
- **MySQL** - Primary database
- **phpMyAdmin** - Database management interface (optional)

## Project Structure

```
Book2Me-Booking-System/
├── backend/
│   ├── app.py                    # Flask app factory
│   ├── config.py                 # Configuration management
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example              # Example environment variables
│   └── app/
│       ├── __init__.py
│       ├── models/               # Database models
│       │   └── __init__.py       # All ORM models
│       ├── routes/               # API blueprints
│       │   ├── auth.py           # Authentication endpoints
│       │   ├── rooms.py          # Room management
│       │   ├── halls.py          # Hall/event space management
│       │   ├── bookings.py       # Booking endpoints
│       │   ├── admin.py          # Admin dashboard endpoints
│       │   └── hr.py             # HR module endpoints
│       └── utils/
│           ├── decorators.py     # Auth decorators
│           └── validators.py     # Validation utilities
│
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # Main router
│       ├── index.css             # Global styles
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── CustomerPortal/   # Customer pages
│       │   ├── AdminDashboard/   # Admin pages
│       │   └── HRModule/         # HR pages
│       ├── components/
│       │   └── Navbar.jsx        # Shared navigation
│       ├── context/
│       │   └── store.js          # Zustand stores
│       └── utils/
│           └── apiClient.js      # Axios configuration
│
└── README.md
```

## Installation & Setup

### Backend Setup

1. **Clone the repository**
   ```bash
   cd Book2Me-Booking-System/backend
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

5. **Create database**
   ```bash
   mysql -u root -p -e "CREATE DATABASE book2me_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

6. **Run the Flask application**
   ```bash
   python app.py
   ```

The backend will start at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Update VITE_API_URL if your backend is on a different URL
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The frontend will start at `http://localhost:3000`

## Environment Variables

### Backend (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=book2me_db
DB_USER=root
DB_PASSWORD=your_password

# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-change-this-in-production

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRES=3600

# Application Configuration
APP_DEBUG=True
LOG_LEVEL=DEBUG
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Rooms
- `GET /api/rooms` - List rooms with filters
- `GET /api/rooms/<id>` - Get room details
- `POST /api/rooms` - Create room (admin only)
- `PUT /api/rooms/<id>` - Update room (admin only)
- `DELETE /api/rooms/<id>` - Delete room (admin only)

### Halls
- `GET /api/halls` - List halls with filters
- `GET /api/halls/<id>` - Get hall details
- `POST /api/halls` - Create hall (admin only)
- `PUT /api/halls/<id>` - Update hall (admin only)
- `DELETE /api/halls/<id>` - Delete hall (admin only)

### Bookings
- `GET /api/bookings/rooms` - Get room bookings
- `POST /api/bookings/rooms` - Create room booking
- `PUT /api/bookings/rooms/<id>` - Update room booking
- `POST /api/bookings/rooms/<id>/cancel` - Cancel room booking
- `GET /api/bookings/halls` - Get hall bookings
- `POST /api/bookings/halls` - Create hall booking
- `PUT /api/bookings/halls/<id>` - Update hall booking
- `POST /api/bookings/halls/<id>/cancel` - Cancel hall booking

### Admin
- `GET /api/admin/analytics/overview` - Dashboard overview
- `GET /api/admin/analytics/revenue` - Revenue analytics
- `GET /api/admin/analytics/occupancy` - Occupancy analytics
- `GET /api/admin/bookings/rooms/all` - All room bookings
- `PUT /api/admin/bookings/rooms/<id>/status` - Update booking status
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/<id>` - Update user

### HR
- `GET /api/hr/staff` - Get all staff
- `POST /api/hr/staff` - Create staff profile
- `PUT /api/hr/staff/<id>` - Update staff
- `POST /api/hr/staff/<id>/deactivate` - Deactivate staff
- `GET /api/hr/shifts` - Get shifts
- `POST /api/hr/shifts` - Create shift
- `DELETE /api/hr/shifts/<id>` - Delete shift
- `GET /api/hr/attendance` - Get attendance records
- `POST /api/hr/attendance` - Mark attendance
- `PUT /api/hr/attendance/<id>` - Update attendance
- `GET /api/hr/payroll` - Get payroll summary

## Database Schema

### Users Table
```sql
- id (PRIMARY KEY)
- email (UNIQUE)
- password_hash
- first_name, last_name
- phone
- role (customer, admin, hr_manager, staff)
- is_active
- created_at, updated_at
```

### Rooms Table
```sql
- id (PRIMARY KEY)
- room_number (UNIQUE)
- room_type
- capacity
- price_per_night
- description
- amenities (JSON)
- floor
- is_active
```

### Bookings Table
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- room_id (FOREIGN KEY)
- check_in_date, check_out_date
- number_of_guests
- total_price
- status
- special_requests
```

## User Roles & Access Control

### Customer
- Browse and book rooms
- Browse and book event halls
- View own bookings
- Cancel own bookings

### Admin
- View all bookings
- Manage room inventory
- Manage event halls
- View analytics and reports
- Manage users

### HR Manager
- Manage staff profiles
- Assign shifts
- Track attendance
- View payroll summary

## Features & Implementation

### JWT Authentication
- Secure token-based authentication
- Role-based access control (RBAC)
- Automatic token refresh handling

### Responsive Design
- Mobile-first approach
- Works on desktop, tablet, and mobile
- Tailwind CSS utility classes

### Data Validation
- Server-side validation for all inputs
- Email format validation
- Password strength requirements
- Date validation for bookings

### Error Handling
- Graceful error messages
- Proper HTTP status codes
- Exception handling in both backend and frontend

## Build & Deployment

### Frontend Build
```bash
cd frontend
npm run build
# Output in dist/ directory
```

### Backend Deployment
1. Update `.env` with production values
2. Install production dependencies: `pip install gunicorn`
3. Run with: `gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()`

## Testing

To test the application:

1. **Register a customer account**
   - Go to /register
   - Fill in the form
   - Login with the account

2. **Create admin account** (manually in database)
   ```sql
   INSERT INTO users (email, password_hash, first_name, last_name, role) 
   VALUES ('admin@book2me.com', BCRYPT_HASH('password123'), 'Admin', 'User', 'admin');
   ```

3. **Test room booking**
   - As customer: Browse rooms → Select room → Choose dates → Book

4. **Test admin dashboard**
   - Login as admin → View analytics → Create room/hall → Manage bookings

## Support & Troubleshooting

### Port Already in Use
- Backend: Change port in `app.py` (default: 5000)
- Frontend: Vite will auto-assign next available port (default: 3000)

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists: `book2me_db`

### CORS Errors
- Ensure backend has `CORS` enabled (included in app.py)
- Check frontend API URL matches backend

## License

This project is provided as-is for educational and commercial use.

## Future Enhancements

- Email notifications for bookings
- Payment integration (Stripe/PayPal)
- Real-time notifications with WebSockets
- Mobile app (React Native)
- Advanced reporting and BI dashboard
- Multi-language support
- Integration with calendar systems (Google Calendar, Outlook)
