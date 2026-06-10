from flask import Blueprint, request, jsonify
from app.models import db, Room
from app.utils.decorators import token_required, admin_required
from app.utils.validators import validate_required_fields, validate_positive_number
from datetime import datetime, date

rooms_bp = Blueprint('rooms', __name__, url_prefix='/api/rooms')


@rooms_bp.route('', methods=['GET'])
def get_rooms():
    """Get all available rooms with optional filters"""
    try:
        # Get query parameters
        room_type = request.args.get('room_type')
        min_capacity = request.args.get('min_capacity', type=int)
        max_price = request.args.get('max_price', type=float)
        check_in = request.args.get('check_in')
        check_out = request.args.get('check_out')
        
        # Base query
        query = Room.query.filter_by(is_active=True)
        
        # Apply filters
        if room_type:
            query = query.filter_by(room_type=room_type)
        if min_capacity:
            query = query.filter(Room.capacity >= min_capacity)
        if max_price:
            query = query.filter(Room.price_per_night <= max_price)
        
        rooms = query.all()
        
        # If dates provided, filter by availability
        if check_in and check_out:
            try:
                check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
                check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
                
                available_rooms = []
                for room in rooms:
                    # Check if room has conflicts with existing bookings
                    from app.models import RoomBooking, BookingStatus
                    conflicts = RoomBooking.query.filter(
                        RoomBooking.room_id == room.id,
                        RoomBooking.status != BookingStatus.CANCELLED,
                        RoomBooking.check_in_date < check_out_date,
                        RoomBooking.check_out_date > check_in_date
                    ).first()
                    
                    if not conflicts:
                        available_rooms.append(room)
                
                rooms = available_rooms
            except ValueError:
                pass  # If date parsing fails, ignore date filters
        
        return jsonify({
            'rooms': [room.to_dict() for room in rooms],
            'count': len(rooms)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rooms_bp.route('/<int:room_id>', methods=['GET'])
def get_room(room_id):
    """Get a specific room"""
    try:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'error': 'Room not found'}), 404
        
        return jsonify({'room': room.to_dict(include_bookings=True)}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rooms_bp.route('', methods=['POST'])
@admin_required
def create_room():
    """Create a new room (admin only)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['room_number', 'room_type', 'capacity', 'price_per_night', 'floor']
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Validate positive numbers
        is_valid, message = validate_positive_number(data['capacity'], 'Capacity')
        if not is_valid:
            return jsonify({'error': message}), 400
        
        is_valid, message = validate_positive_number(data['price_per_night'], 'Price per night')
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if room number already exists
        if Room.query.filter_by(room_number=data['room_number']).first():
            return jsonify({'error': 'Room number already exists'}), 409
        
        # Create room
        room = Room(
            room_number=data['room_number'],
            room_type=data['room_type'],
            capacity=int(data['capacity']),
            price_per_night=float(data['price_per_night']),
            description=data.get('description'),
            amenities=data.get('amenities', []),
            floor=int(data.get('floor', 1))
        )
        
        db.session.add(room)
        db.session.commit()
        
        return jsonify({
            'message': 'Room created successfully',
            'room': room.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rooms_bp.route('/<int:room_id>', methods=['PUT'])
@admin_required
def update_room(room_id):
    """Update a room (admin only)"""
    try:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'error': 'Room not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'room_type' in data:
            room.room_type = data['room_type']
        if 'capacity' in data:
            is_valid, message = validate_positive_number(data['capacity'], 'Capacity')
            if not is_valid:
                return jsonify({'error': message}), 400
            room.capacity = int(data['capacity'])
        if 'price_per_night' in data:
            is_valid, message = validate_positive_number(data['price_per_night'], 'Price per night')
            if not is_valid:
                return jsonify({'error': message}), 400
            room.price_per_night = float(data['price_per_night'])
        if 'description' in data:
            room.description = data['description']
        if 'amenities' in data:
            room.amenities = data['amenities']
        if 'floor' in data:
            room.floor = int(data['floor'])
        if 'is_active' in data:
            room.is_active = bool(data['is_active'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Room updated successfully',
            'room': room.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rooms_bp.route('/<int:room_id>', methods=['DELETE'])
@admin_required
def delete_room(room_id):
    """Delete a room (admin only)"""
    try:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'error': 'Room not found'}), 404
        
        db.session.delete(room)
        db.session.commit()
        
        return jsonify({'message': 'Room deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
