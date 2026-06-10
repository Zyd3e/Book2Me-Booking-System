from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models import (
    db, User, Room, Hall, RoomBooking, HallBooking, BookingStatus, UserRole
)
from app.utils.decorators import admin_required
from app.utils.validators import validate_required_fields

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ==================== DASHBOARD ANALYTICS ====================

@admin_bp.route('/analytics/overview', methods=['GET'])
@admin_required
def get_overview_analytics():
    """Get overview analytics for admin dashboard"""
    try:
        # Count active bookings
        active_room_bookings = RoomBooking.query.filter(
            RoomBooking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN])
        ).count()
        
        active_hall_bookings = HallBooking.query.filter(
            HallBooking.status.in_([BookingStatus.CONFIRMED])
        ).count()
        
        # Total revenue
        room_revenue = db.session.query(func.sum(RoomBooking.total_price)).filter(
            RoomBooking.status != BookingStatus.CANCELLED
        ).scalar() or 0
        
        hall_revenue = db.session.query(func.sum(HallBooking.total_price)).filter(
            HallBooking.status != BookingStatus.CANCELLED
        ).scalar() or 0
        
        # Room occupancy
        total_rooms = Room.query.filter_by(is_active=True).count()
        occupied_rooms = db.session.query(func.count(RoomBooking.id)).filter(
            RoomBooking.status == BookingStatus.CHECKED_IN
        ).scalar() or 0
        
        occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
        
        # Booking trends (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        bookings_last_week = RoomBooking.query.filter(
            RoomBooking.created_at >= seven_days_ago,
            RoomBooking.status != BookingStatus.CANCELLED
        ).count()
        
        return jsonify({
            'active_room_bookings': active_room_bookings,
            'active_hall_bookings': active_hall_bookings,
            'total_room_revenue': float(room_revenue),
            'total_hall_revenue': float(hall_revenue),
            'total_revenue': float(room_revenue + hall_revenue),
            'room_occupancy_rate': round(occupancy_rate, 2),
            'occupied_rooms': occupied_rooms,
            'total_rooms': total_rooms,
            'bookings_last_week': bookings_last_week,
            'total_users': User.query.count(),
            'total_customers': User.query.filter_by(role=UserRole.CUSTOMER).count(),
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/analytics/revenue', methods=['GET'])
@admin_required
def get_revenue_analytics():
    """Get revenue analytics by date range"""
    try:
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Daily room revenue
        room_revenue_by_date = db.session.query(
            func.date(RoomBooking.created_at).label('date'),
            func.sum(RoomBooking.total_price).label('revenue')
        ).filter(
            RoomBooking.created_at >= start_date,
            RoomBooking.status != BookingStatus.CANCELLED
        ).group_by(func.date(RoomBooking.created_at)).all()
        
        # Daily hall revenue
        hall_revenue_by_date = db.session.query(
            func.date(HallBooking.created_at).label('date'),
            func.sum(HallBooking.total_price).label('revenue')
        ).filter(
            HallBooking.created_at >= start_date,
            HallBooking.status != BookingStatus.CANCELLED
        ).group_by(func.date(HallBooking.created_at)).all()
        
        return jsonify({
            'room_revenue': [
                {'date': str(item[0]), 'revenue': float(item[1] or 0)}
                for item in room_revenue_by_date
            ],
            'hall_revenue': [
                {'date': str(item[0]), 'revenue': float(item[1] or 0)}
                for item in hall_revenue_by_date
            ]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/analytics/occupancy', methods=['GET'])
@admin_required
def get_occupancy_analytics():
    """Get room occupancy analytics"""
    try:
        # Room-wise occupancy
        rooms = Room.query.filter_by(is_active=True).all()
        room_occupancy = []
        
        for room in rooms:
            bookings = RoomBooking.query.filter(
                RoomBooking.room_id == room.id,
                RoomBooking.status != BookingStatus.CANCELLED
            ).count()
            
            room_occupancy.append({
                'room_id': room.id,
                'room_number': room.room_number,
                'room_type': room.room_type,
                'bookings': bookings,
                'capacity': room.capacity,
                'price_per_night': room.price_per_night
            })
        
        return jsonify({
            'room_occupancy': room_occupancy,
            'total_data_points': len(room_occupancy)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== BOOKING MANAGEMENT ====================

@admin_bp.route('/bookings/rooms/all', methods=['GET'])
@admin_required
def get_all_room_bookings():
    """Get all room bookings with filters"""
    try:
        status = request.args.get('status')
        room_id = request.args.get('room_id', type=int)
        
        query = RoomBooking.query
        
        if status:
            try:
                query = query.filter_by(status=BookingStatus[status.upper()])
            except KeyError:
                pass
        
        if room_id:
            query = query.filter_by(room_id=room_id)
        
        bookings = query.all()
        
        return jsonify({
            'bookings': [b.to_dict() for b in bookings],
            'count': len(bookings)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/bookings/rooms/<int:booking_id>/status', methods=['PUT'])
@admin_required
def update_room_booking_status(booking_id):
    """Update room booking status"""
    try:
        booking = RoomBooking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        data = request.get_json()
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        try:
            new_status = BookingStatus[data['status'].upper()]
            booking.status = new_status
            db.session.commit()
            
            return jsonify({
                'message': 'Booking status updated',
                'booking': booking.to_dict()
            }), 200
        except KeyError:
            return jsonify({'error': 'Invalid status'}), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/bookings/halls/all', methods=['GET'])
@admin_required
def get_all_hall_bookings():
    """Get all hall bookings with filters"""
    try:
        status = request.args.get('status')
        hall_id = request.args.get('hall_id', type=int)
        
        query = HallBooking.query
        
        if status:
            try:
                query = query.filter_by(status=BookingStatus[status.upper()])
            except KeyError:
                pass
        
        if hall_id:
            query = query.filter_by(hall_id=hall_id)
        
        bookings = query.all()
        
        return jsonify({
            'bookings': [b.to_dict() for b in bookings],
            'count': len(bookings)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/bookings/halls/<int:booking_id>/status', methods=['PUT'])
@admin_required
def update_hall_booking_status(booking_id):
    """Update hall booking status"""
    try:
        booking = HallBooking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        data = request.get_json()
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        try:
            new_status = BookingStatus[data['status'].upper()]
            booking.status = new_status
            db.session.commit()
            
            return jsonify({
                'message': 'Booking status updated',
                'booking': booking.to_dict()
            }), 200
        except KeyError:
            return jsonify({'error': 'Invalid status'}), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== USER MANAGEMENT ====================

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Get all users"""
    try:
        role = request.args.get('role')
        
        query = User.query
        if role:
            try:
                query = query.filter_by(role=UserRole[role.upper()])
            except KeyError:
                pass
        
        users = query.all()
        
        return jsonify({
            'users': [u.to_dict() for u in users],
            'count': len(users)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user details"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
        if 'role' in data:
            try:
                user.role = UserRole[data['role'].upper()]
            except KeyError:
                return jsonify({'error': 'Invalid role'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/deactivate', methods=['POST'])
@admin_required
def deactivate_user(user_id):
    """Deactivate a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'User deactivated successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
