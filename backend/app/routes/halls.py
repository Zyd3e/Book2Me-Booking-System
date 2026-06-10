from flask import Blueprint, request, jsonify
from app.models import db, Hall
from app.utils.decorators import token_required, admin_required
from app.utils.validators import validate_required_fields, validate_positive_number
from datetime import datetime

halls_bp = Blueprint('halls', __name__, url_prefix='/api/halls')


@halls_bp.route('', methods=['GET'])
def get_halls():
    """Get all available halls with optional filters"""
    try:
        # Get query parameters
        hall_type = request.args.get('hall_type')
        min_capacity = request.args.get('min_capacity', type=int)
        max_price = request.args.get('max_price', type=float)
        
        # Base query
        query = Hall.query.filter_by(is_active=True)
        
        # Apply filters
        if hall_type:
            query = query.filter_by(hall_type=hall_type)
        if min_capacity:
            query = query.filter(Hall.capacity >= min_capacity)
        if max_price:
            query = query.filter(Hall.price_per_hour <= max_price)
        
        halls = query.all()
        
        # If date provided, filter by availability
        event_date = request.args.get('event_date')
        if event_date:
            try:
                event_date_obj = datetime.strptime(event_date, '%Y-%m-%d').date()
                
                available_halls = []
                for hall in halls:
                    from app.models import HallBooking, BookingStatus
                    conflicts = HallBooking.query.filter(
                        HallBooking.hall_id == hall.id,
                        HallBooking.status != BookingStatus.CANCELLED,
                        HallBooking.event_date == event_date_obj
                    ).all()
                    
                    if not conflicts:
                        available_halls.append(hall)
                
                halls = available_halls
            except ValueError:
                pass
        
        return jsonify({
            'halls': [hall.to_dict() for hall in halls],
            'count': len(halls)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@halls_bp.route('/<int:hall_id>', methods=['GET'])
def get_hall(hall_id):
    """Get a specific hall"""
    try:
        hall = Hall.query.get(hall_id)
        if not hall:
            return jsonify({'error': 'Hall not found'}), 404
        
        return jsonify({'hall': hall.to_dict(include_bookings=True)}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@halls_bp.route('', methods=['POST'])
@admin_required
def create_hall():
    """Create a new hall (admin only)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['hall_name', 'hall_type', 'capacity', 'price_per_hour']
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Validate positive numbers
        is_valid, message = validate_positive_number(data['capacity'], 'Capacity')
        if not is_valid:
            return jsonify({'error': message}), 400
        
        is_valid, message = validate_positive_number(data['price_per_hour'], 'Price per hour')
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if hall name already exists
        if Hall.query.filter_by(hall_name=data['hall_name']).first():
            return jsonify({'error': 'Hall name already exists'}), 409
        
        # Create hall
        hall = Hall(
            hall_name=data['hall_name'],
            hall_type=data['hall_type'],
            capacity=int(data['capacity']),
            price_per_hour=float(data['price_per_hour']),
            description=data.get('description'),
            amenities=data.get('amenities', [])
        )
        
        db.session.add(hall)
        db.session.commit()
        
        return jsonify({
            'message': 'Hall created successfully',
            'hall': hall.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@halls_bp.route('/<int:hall_id>', methods=['PUT'])
@admin_required
def update_hall(hall_id):
    """Update a hall (admin only)"""
    try:
        hall = Hall.query.get(hall_id)
        if not hall:
            return jsonify({'error': 'Hall not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'hall_type' in data:
            hall.hall_type = data['hall_type']
        if 'capacity' in data:
            is_valid, message = validate_positive_number(data['capacity'], 'Capacity')
            if not is_valid:
                return jsonify({'error': message}), 400
            hall.capacity = int(data['capacity'])
        if 'price_per_hour' in data:
            is_valid, message = validate_positive_number(data['price_per_hour'], 'Price per hour')
            if not is_valid:
                return jsonify({'error': message}), 400
            hall.price_per_hour = float(data['price_per_hour'])
        if 'description' in data:
            hall.description = data['description']
        if 'amenities' in data:
            hall.amenities = data['amenities']
        if 'is_active' in data:
            hall.is_active = bool(data['is_active'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Hall updated successfully',
            'hall': hall.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@halls_bp.route('/<int:hall_id>', methods=['DELETE'])
@admin_required
def delete_hall(hall_id):
    """Delete a hall (admin only)"""
    try:
        hall = Hall.query.get(hall_id)
        if not hall:
            return jsonify({'error': 'Hall not found'}), 404
        
        db.session.delete(hall)
        db.session.commit()
        
        return jsonify({'message': 'Hall deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
