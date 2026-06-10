from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import enum

db = SQLAlchemy()


class UserRole(enum.Enum):
    """User role enumeration"""
    CUSTOMER = "customer"
    ADMIN = "admin"
    HR_MANAGER = "hr_manager"
    STAFF = "staff"


class User(db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    role = db.Column(db.Enum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False, default=UserRole.CUSTOMER)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bookings = db.relationship('RoomBooking', back_populates='user', cascade='all, delete-orphan')
    hall_bookings = db.relationship('HallBooking', back_populates='user', cascade='all, delete-orphan')
    staff_profile = db.relationship('StaffProfile', back_populates='user', uselist=False, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'role': self.role.value,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
        }


class Room(db.Model):
    """Room model"""
    __tablename__ = 'rooms'
    
    id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    room_type = db.Column(db.String(100), nullable=False)  # Single, Double, Suite, etc.
    capacity = db.Column(db.Integer, nullable=False)
    price_per_night = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    amenities = db.Column(db.JSON, nullable=True)  # ['WiFi', 'AC', 'TV', 'Minibar']
    floor = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bookings = db.relationship('RoomBooking', back_populates='room', cascade='all, delete-orphan')
    
    def to_dict(self, include_bookings=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'room_number': self.room_number,
            'room_type': self.room_type,
            'capacity': self.capacity,
            'price_per_night': self.price_per_night,
            'description': self.description,
            'amenities': self.amenities,
            'floor': self.floor,
            'is_active': self.is_active,
        }
        if include_bookings:
            data['bookings'] = [b.to_dict() for b in self.bookings]
        return data


class Hall(db.Model):
    """Hall/Event Space model"""
    __tablename__ = 'halls'
    
    id = db.Column(db.Integer, primary_key=True)
    hall_name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    hall_type = db.Column(db.String(100), nullable=False)  # Conference, Banquet, Wedding, etc.
    capacity = db.Column(db.Integer, nullable=False)
    price_per_hour = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    amenities = db.Column(db.JSON, nullable=True)  # ['Projector', 'Sound System', 'Catering']
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bookings = db.relationship('HallBooking', back_populates='hall', cascade='all, delete-orphan')
    
    def to_dict(self, include_bookings=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'hall_name': self.hall_name,
            'hall_type': self.hall_type,
            'capacity': self.capacity,
            'price_per_hour': self.price_per_hour,
            'description': self.description,
            'amenities': self.amenities,
            'is_active': self.is_active,
        }
        if include_bookings:
            data['bookings'] = [b.to_dict() for b in self.bookings]
        return data


class BookingStatus(enum.Enum):
    """Booking status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"


class RoomBooking(db.Model):
    """Room booking model"""
    __tablename__ = 'room_bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False, index=True)
    check_in_date = db.Column(db.Date, nullable=False)
    check_out_date = db.Column(db.Date, nullable=False)
    number_of_guests = db.Column(db.Integer, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.Enum(BookingStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=BookingStatus.PENDING)
    special_requests = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='bookings')
    room = db.relationship('Room', back_populates='bookings')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'room_id': self.room_id,
            'room': self.room.to_dict() if self.room else None,
            'check_in_date': self.check_in_date.isoformat(),
            'check_out_date': self.check_out_date.isoformat(),
            'number_of_guests': self.number_of_guests,
            'total_price': self.total_price,
            'status': self.status.value,
            'special_requests': self.special_requests,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


class HallBooking(db.Model):
    """Hall booking model"""
    __tablename__ = 'hall_bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    hall_id = db.Column(db.Integer, db.ForeignKey('halls.id'), nullable=False, index=True)
    event_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    event_type = db.Column(db.String(100), nullable=False)
    expected_guests = db.Column(db.Integer, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.Enum(BookingStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=BookingStatus.PENDING)
    special_requirements = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='hall_bookings')
    hall = db.relationship('Hall', back_populates='bookings')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'hall_id': self.hall_id,
            'hall': self.hall.to_dict() if self.hall else None,
            'event_date': self.event_date.isoformat(),
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'event_type': self.event_type,
            'expected_guests': self.expected_guests,
            'total_price': self.total_price,
            'status': self.status.value,
            'special_requirements': self.special_requirements,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


class StaffProfile(db.Model):
    """Staff profile model"""
    __tablename__ = 'staff_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True, index=True)
    employee_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    department = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    salary = db.Column(db.Float, nullable=True)
    hire_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='staff_profile')
    shifts = db.relationship('Shift', back_populates='staff', cascade='all, delete-orphan')
    attendance_records = db.relationship('Attendance', back_populates='staff', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'employee_id': self.employee_id,
            'department': self.department,
            'position': self.position,
            'salary': self.salary,
            'hire_date': self.hire_date.isoformat(),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
        }


class Shift(db.Model):
    """Staff shift model"""
    __tablename__ = 'shifts'
    
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff_profiles.id'), nullable=False, index=True)
    shift_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    shift_type = db.Column(db.String(50), nullable=False)  # Morning, Evening, Night
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    staff = db.relationship('StaffProfile', back_populates='shifts')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'shift_date': self.shift_date.isoformat(),
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'shift_type': self.shift_type,
        }


class Attendance(db.Model):
    """Staff attendance model"""
    __tablename__ = 'attendance'
    
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff_profiles.id'), nullable=False, index=True)
    attendance_date = db.Column(db.Date, nullable=False)
    check_in_time = db.Column(db.Time, nullable=True)
    check_out_time = db.Column(db.Time, nullable=True)
    status = db.Column(db.String(50), nullable=False)  # Present, Absent, Leave, Half-day
    remarks = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    staff = db.relationship('StaffProfile', back_populates='attendance_records')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'attendance_date': self.attendance_date.isoformat(),
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'check_out_time': self.check_out_time.isoformat() if self.check_out_time else None,
            'status': self.status,
            'remarks': self.remarks,
        }
