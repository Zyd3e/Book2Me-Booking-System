from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, date
from app.models import (
    db, RoomBooking, HallBooking, Room, Hall, BookingStatus, User, UserRole
)
from app.utils.decorators import token_required, admin_required
from app.utils.validators import validate_required_fields, validate_dates

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')


# ==================== ROOM BOOKINGS ====================

@bookings_bp.route('/rooms', methods=['GET'])
@token_required
def get_room_bookings():
    """Get room bookings for current user or all (if admin)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user.role == UserRole.ADMIN:
            # Admin can see all bookings
            bookings = RoomBooking.query.all()
        else:
            # Customer sees only their bookings
            bookings = RoomBooking.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'bookings': [b.to_dict() for b in bookings],
            'count': len(bookings)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bookings_bp.route('/rooms/<int:booking_id>', methods=['GET'])
@token_required
def get_room_booking(booking_id):
    """Get a specific room booking"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        booking = RoomBooking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check permission
        if user.role != UserRole.ADMIN and booking.user_id != current_user_id:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        return jsonify({'booking': booking.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bookings_bp.route('/rooms', methods=['POST'])
@token_required
def create_room_booking():
    """Create a new room booking"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['room_id', 'check_in_date', 'check_out_date', 'number_of_guests']
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Validate dates
        is_valid, message = validate_dates(data['check_in_date'], data['check_out_date'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Get room
        room = Room.query.get(data['room_id'])
        if not room or not room.is_active:
            return jsonify({'error': 'Room not found or inactive'}), 404
        
        # Validate number of guests
        if int(data['number_of_guests']) > room.capacity:
            return jsonify({'error': f'Room capacity is {room.capacity}'}), 400
        
        # Parse dates
        check_in_date = datetime.strptime(data['check_in_date'], '%Y-%m-%d').date()
        check_out_date = datetime.strptime(data['check_out_date'], '%Y-%m-%d').date()
        
        # Check for conflicts
        conflicts = RoomBooking.query.filter(
            RoomBooking.room_id == data['room_id'],
            RoomBooking.status != BookingStatus.CANCELLED,
            RoomBooking.check_in_date < check_out_date,
            RoomBooking.check_out_date > check_in_date
        ).first()
        
        if conflicts:
            return jsonify({'error': 'Room not available for selected dates'}), 409
        
        # Calculate total price
        num_nights = (check_out_date - check_in_date).days
        total_price = room.price_per_night * num_nights
        
        # Create booking
        booking = RoomBooking(
            user_id=current_user_id,
            room_id=data['room_id'],
            check_in_date=check_in_date,
            check_out_date=check_out_date,
            number_of_guests=int(data['number_of_guests']),
            total_price=total_price,
            special_requests=data.get('special_requests')
        )
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'message': 'Room booking created successfully',
            'booking': booking.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bookings_bp.route('/rooms/<int:booking_id>', methods=['PUT'])
@token_required
def update_room_booking(booking_id):
    """Update a room booking"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        booking = RoomBooking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check permission
        if user.role != UserRole.ADMIN and booking.user_id != current_user_id:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Can only modify pending or confirmed bookings
        if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
            return jsonify({'error': 'Cannot modify booking in current status'}), 400
        
        data = request.get_json()
        
        # Update fields if provided
        if 'check_in_date' in data or 'check_out_date' in data:
            check_in = data.get('check_in_date', booking.check_in_date.isoformat())
            check_out = data.get('check_out_date', booking.check_out_date.isoformat())
            
            is_valid, message = validate_dates(check_in, check_out)
            if not is_valid:
                return jsonify({'error': message}), 400
            
            booking.check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            booking.check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            
            # Recalculate total price
            num_nights = (booking.check_out_date - booking.check_in_date).days
            booking.total_price = booking.room.price_per_night * num_nights
        
        if 'number_of_guests' in data:
            if int(data['number_of_guests']) > booking.room.capacity:
                return jsonify({'error': f'Room capacity is {booking.room.capacity}'}), 400
            booking.number_of_guests = int(data['number_of_guests'])
        
        if 'special_requests' in data:
            booking.special_requests = data['special_requests']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Room booking updated successfully',
            'booking': booking.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bookings_bp.route('/rooms/<int:booking_id>/cancel', methods=['POST'])
@token_required
def cancel_room_booking(booking_id):
    """Cancel a room booking"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        booking = RoomBooking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check permission
        if user.role != UserRole.ADMIN and booking.user_id != current_user_id:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Can only cancel pending or confirmed bookings
        if booking.status in [BookingStatus.CANCELLED, BookingStatus.CHECKED_OUT]:
            return jsonify({'error': 'Booking already cancelled or checked out'}), 400
        
        booking.status = BookingStatus.CANCELLED
        db.session.commit()
        
        return jsonify({
            'message': 'Room booking cancelled successfully',
            'booking': booking.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== HALL BOOKINGS ====================

@bookings_bp.route('/halls', methods=['GET'])
@token_required
def get_hall_bookings():
    """Get hall bookings for current user or all (if admin)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user.role == UserRole.ADMIN:
            bookings = HallBooking.query.all()
        else:
            bookings = HallBooking.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'bookings': [b.to_dict() for b in bookings],
            'count': len(bookings)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bookings_bp.route('/halls/<int:booking_id>', methods=['GET'])
@token_required
def get_hall_booking(booking_id):
    """Get a specific hall booking"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        booking = HallBooking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if user.role != UserRole.ADMIN and booking.user_id != current_user_id:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        return jsonify({'booking': booking.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bookings_bp.route('/halls', methods=['POST'])
@token_required
def create_hall_booking():
    """Create a new hall booking"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['hall_id', 'event_date', 'start_time', 'end_time', 'event_type', 'expected_guests']
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Get hall
        hall = Hall.query.get(data['hall_id'])
        if not hall or not hall.is_active:
            return jsonify({'error': 'Hall not found or inactive'}), 404
        
        # Validate guest count
        if int(data['expected_guests']) > hall.capacity:
            return jsonify({'error': f'Hall capacity is {hall.capacity}'}), 400
        
        # Parse event date and times
        try:
            event_date = datetime.strptime(data['event_date'], '%Y-%m-%d').date()
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid date or time format'}), 400
        
        if start_time >= end_time:
            return jsonify({'error': 'End time must be after start time'}), 400
        
        # Check for conflicts
        conflicts = HallBooking.query.filter(
            HallBooking.hall_id == data['hall_id'],
            HallBooking.status != BookingStatus.CANCELLED,
            HallBooking.event_date == event_date,
            HallBooking.start_time < end_time,
            HallBooking.end_time > start_time
        ).first()
        
        if conflicts:
            return jsonify({'error': 'Hall not available for selected time'}), 409
        
        # Calculate duration and total price
        from datetime import timedelta
        duration_minutes = int((datetime.combine(date.today(), end_time) - 
                               datetime.combine(date.today(), start_time)).total_seconds() / 60)
        duration_hours = duration_minutes / 60
        total_price = hall.price_per_hour * duration_hours
        
        # Create booking
        booking = HallBooking(
            user_id=current_user_id,
            hall_id=data['hall_id'],
            event_date=event_date,
            start_time=start_time,
            end_time=end_time,
            event_type=data['event_type'],
            expected_guests=int(data['expected_guests']),
            total_price=total_price,
            special_requirements=data.get('special_requirements')
        )
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'message': 'Hall booking created successfully',
            'booking': booking.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bookings_bp.route('/halls/<int:booking_id>', methods=['PUT'])
@token_required
def update_hall_booking(booking_id):
    """Update a hall booking"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        booking = HallBooking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if user.role != UserRole.ADMIN and booking.user_id != current_user_id:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
            return jsonify({'error': 'Cannot modify booking in current status'}), 400
        
        data = request.get_json()
        
        # Similar update logic as room booking
        if 'expected_guests' in data:
            if int(data['expected_guests']) > booking.hall.capacity:
                return jsonify({'error': f'Hall capacity is {booking.hall.capacity}'}), 400
            booking.expected_guests = int(data['expected_guests'])
        
        if 'special_requirements' in data:
            booking.special_requirements = data['special_requirements']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Hall booking updated successfully',
            'booking': booking.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bookings_bp.route('/halls/<int:booking_id>/cancel', methods=['POST'])
@token_required
def cancel_hall_booking(booking_id):
    """Cancel a hall booking"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        booking = HallBooking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if user.role != UserRole.ADMIN and booking.user_id != current_user_id:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        if booking.status in [BookingStatus.CANCELLED]:
            return jsonify({'error': 'Booking already cancelled'}), 400
        
        booking.status = BookingStatus.CANCELLED
        db.session.commit()
        
        return jsonify({
            'message': 'Hall booking cancelled successfully',
            'booking': booking.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
