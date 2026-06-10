# Book2Me - Quick Start Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 5.7+ or MariaDB 10.3+
- Git
- npm or yarn

## Backend Setup (Flask)

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Python Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create MySQL Database

Open MySQL client and run:
```bash
mysql -u root -p
```

Then execute:
```sql
CREATE DATABASE book2me_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

Or use the provided schema file:
```bash
mysql -u root -p book2me_db < schema.sql
```

### 5. Configure Environment Variables

Copy and edit `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=book2me_db
DB_USER=root
DB_PASSWORD=your_mysql_password
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-12345
JWT_SECRET_KEY=your-jwt-secret-key-12345
JWT_ACCESS_TOKEN_EXPIRES=3600
APP_DEBUG=True
LOG_LEVEL=DEBUG
```

### 6. Start Flask Server
```bash
python app.py
```

Flask will start at: `http://localhost:5000`

---

## Frontend Setup (React)

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example`:
```bash
cp .env.example .env
```

The `.env` file should look like:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Start Development Server
```bash
npm run dev
```

React will start at: `http://localhost:3000`

---

## Testing the Application

### 1. Customer Account
- Go to `http://localhost:3000/register`
- Create a new account
- Login and browse rooms/halls
- Make a booking

### 2. Admin Account
Create admin user in MySQL:
```sql
-- Password hash for 'admin123'
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES ('admin@book2me.com', '$2b$12$...', 'Admin', 'User', 'admin');
```

Or modify an existing user:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your_email@example.com';
```

- Login as admin
- Access admin dashboard: `http://localhost:3000/admin/dashboard`
- Manage rooms and halls
- View bookings and analytics

### 3. HR Account
```sql
UPDATE users SET role = 'hr_manager' WHERE email = 'your_email@example.com';
```

- Login as HR manager
- Access HR module: `http://localhost:3000/hr/staff`
- Manage staff profiles

---

## API Testing

Use tools like Postman, curl, or VS Code REST Client to test APIs:

### Authentication Example
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Pass123456",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Pass123456"
  }'
```

---

## Production Build

### Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

Deploy `dist` folder to:
- Vercel, Netlify, GitHub Pages
- or serve with Nginx/Apache

### Backend
```bash
pip install gunicorn

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

Deploy to:
- Heroku, Railway, Render
- AWS EC2, DigitalOcean
- Self-hosted VPS

---

## Common Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :5000          # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>          # macOS/Linux
taskkill /PID <PID> /F # Windows
```

### Database Connection Error
- Verify MySQL is running
- Check credentials in `.env`
- Run: `mysql -u root -p` to test connection

### CORS Error
- Check `CORS` is enabled in Flask (included by default)
- Verify frontend API URL in `.env`

### JWT Token Invalid
- Token may have expired (default 1 hour)
- Try logging out and back in
- Check `JWT_SECRET_KEY` is set

### Module Not Found Error
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

---

## Development Tools

### Database Management
- PHPMyAdmin: `http://localhost/phpmyadmin`
- MySQL Workbench
- DBeaver

### API Testing
- Postman
- Insomnia
- REST Client extension for VS Code

### Debugging
- Flask: Use `app.run(debug=True)`
- React DevTools browser extension
- Browser console (F12)

---

## File Structure Reference

```
backend/
├── app.py                 # Flask entry point
├── config.py             # Configuration
├── requirements.txt       # Dependencies
├── schema.sql            # Database schema
├── .env.example          # Environment template
└── app/
    ├── models/           # Database models
    ├── routes/           # API endpoints
    └── utils/            # Utilities

frontend/
├── index.html            # HTML entry point
├── vite.config.js        # Vite config
├── tailwind.config.js    # Tailwind config
├── .env.example          # Environment template
└── src/
    ├── App.jsx           # Main router
    ├── pages/            # Page components
    ├── components/       # Reusable components
    ├── context/          # State management
    └── utils/            # Utilities
```

---

## Next Steps

1. ✅ Run backend: `python app.py`
2. ✅ Run frontend: `npm run dev`
3. ✅ Open browser: `http://localhost:3000`
4. ✅ Create account and test
5. ✅ Create admin account for dashboard testing
6. ✅ Explore all features

---

## Support

For issues or questions:
- Check README.md for detailed documentation
- Review API endpoints in docs
- Check browser console for errors
- Check Flask terminal output for server errors

Happy booking!
