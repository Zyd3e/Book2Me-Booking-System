from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, date
from app.models import (
    db, StaffProfile, Shift, Attendance, User, UserRole
)
from app.utils.decorators import hr_required, token_required
from app.utils.validators import validate_required_fields, validate_positive_number

hr_bp = Blueprint('hr', __name__, url_prefix='/api/hr')


# ==================== STAFF MANAGEMENT ====================

@hr_bp.route('/staff', methods=['GET'])
@hr_required
def get_all_staff():
    """Get all staff members"""
    try:
        department = request.args.get('department')
        is_active = request.args.get('is_active', 'true').lower() == 'true'
        
        query = StaffProfile.query
        
        if department:
            query = query.filter_by(department=department)
        
        query = query.filter_by(is_active=is_active)
        
        staff = query.all()
        
        return jsonify({
            'staff': [s.to_dict() for s in staff],
            'count': len(staff)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/staff/<int:staff_id>', methods=['GET'])
@hr_required
def get_staff(staff_id):
    """Get a specific staff member"""
    try:
        staff = StaffProfile.query.get(staff_id)
        if not staff:
            return jsonify({'error': 'Staff not found'}), 404
        
        data = staff.to_dict()
        data['shifts'] = [s.to_dict() for s in staff.shifts]
        
        return jsonify({'staff': data}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/staff', methods=['POST'])
@hr_required
def create_staff():
    """Create a new staff member"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'employee_id', 'department', 'position', 'hire_date']
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if user exists
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if employee_id is unique
        if StaffProfile.query.filter_by(employee_id=data['employee_id']).first():
            return jsonify({'error': 'Employee ID already exists'}), 409
        
        # Check if staff profile already exists for user
        if StaffProfile.query.filter_by(user_id=data['user_id']).first():
            return jsonify({'error': 'Staff profile already exists for this user'}), 409
        
        # Validate salary if provided
        if 'salary' in data and data['salary'] is not None:
            is_valid, message = validate_positive_number(data['salary'], 'Salary')
            if not is_valid:
                return jsonify({'error': message}), 400
        
        # Parse hire date
        try:
            hire_date = datetime.strptime(data['hire_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid hire date format'}), 400
        
        # Create staff profile
        staff = StaffProfile(
            user_id=data['user_id'],
            employee_id=data['employee_id'],
            department=data['department'],
            position=data['position'],
            salary=float(data['salary']) if data.get('salary') else None,
            hire_date=hire_date
        )
        
        db.session.add(staff)
        db.session.commit()
        
        return jsonify({
            'message': 'Staff created successfully',
            'staff': staff.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/staff/<int:staff_id>', methods=['PUT'])
@hr_required
def update_staff(staff_id):
    """Update staff member"""
    try:
        staff = StaffProfile.query.get(staff_id)
        if not staff:
            return jsonify({'error': 'Staff not found'}), 404
        
        data = request.get_json()
        
        if 'department' in data:
            staff.department = data['department']
        if 'position' in data:
            staff.position = data['position']
        if 'salary' in data and data['salary'] is not None:
            is_valid, message = validate_positive_number(data['salary'], 'Salary')
            if not is_valid:
                return jsonify({'error': message}), 400
            staff.salary = float(data['salary'])
        if 'is_active' in data:
            staff.is_active = bool(data['is_active'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Staff updated successfully',
            'staff': staff.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/staff/<int:staff_id>/deactivate', methods=['POST'])
@hr_required
def deactivate_staff(staff_id):
    """Deactivate a staff member"""
    try:
        staff = StaffProfile.query.get(staff_id)
        if not staff:
            return jsonify({'error': 'Staff not found'}), 404
        
        staff.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Staff deactivated successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== SHIFT MANAGEMENT ====================

@hr_bp.route('/shifts', methods=['GET'])
@hr_required
def get_shifts():
    """Get all shifts"""
    try:
        staff_id = request.args.get('staff_id', type=int)
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        
        query = Shift.query
        
        if staff_id:
            query = query.filter_by(staff_id=staff_id)
        
        if from_date:
            try:
                from_date_obj = datetime.strptime(from_date, '%Y-%m-%d').date()
                query = query.filter(Shift.shift_date >= from_date_obj)
            except ValueError:
                pass
        
        if to_date:
            try:
                to_date_obj = datetime.strptime(to_date, '%Y-%m-%d').date()
                query = query.filter(Shift.shift_date <= to_date_obj)
            except ValueError:
                pass
        
        shifts = query.all()
        
        return jsonify({
            'shifts': [s.to_dict() for s in shifts],
            'count': len(shifts)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/shifts', methods=['POST'])
@hr_required
def create_shift():
    """Create a new shift"""
    try:
        data = request.get_json()
        
        required_fields = ['staff_id', 'shift_date', 'start_time', 'end_time', 'shift_type']
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if staff exists
        staff = StaffProfile.query.get(data['staff_id'])
        if not staff:
            return jsonify({'error': 'Staff not found'}), 404
        
        # Parse dates and times
        try:
            shift_date = datetime.strptime(data['shift_date'], '%Y-%m-%d').date()
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid date or time format'}), 400
        
        if start_time >= end_time:
            return jsonify({'error': 'End time must be after start time'}), 400
        
        # Create shift
        shift = Shift(
            staff_id=data['staff_id'],
            shift_date=shift_date,
            start_time=start_time,
            end_time=end_time,
            shift_type=data['shift_type']
        )
        
        db.session.add(shift)
        db.session.commit()
        
        return jsonify({
            'message': 'Shift created successfully',
            'shift': shift.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/shifts/<int:shift_id>', methods=['DELETE'])
@hr_required
def delete_shift(shift_id):
    """Delete a shift"""
    try:
        shift = Shift.query.get(shift_id)
        if not shift:
            return jsonify({'error': 'Shift not found'}), 404
        
        db.session.delete(shift)
        db.session.commit()
        
        return jsonify({'message': 'Shift deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== ATTENDANCE MANAGEMENT ====================

@hr_bp.route('/attendance', methods=['GET'])
@hr_required
def get_attendance():
    """Get attendance records"""
    try:
        staff_id = request.args.get('staff_id', type=int)
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        
        query = Attendance.query
        
        if staff_id:
            query = query.filter_by(staff_id=staff_id)
        
        if from_date:
            try:
                from_date_obj = datetime.strptime(from_date, '%Y-%m-%d').date()
                query = query.filter(Attendance.attendance_date >= from_date_obj)
            except ValueError:
                pass
        
        if to_date:
            try:
                to_date_obj = datetime.strptime(to_date, '%Y-%m-%d').date()
                query = query.filter(Attendance.attendance_date <= to_date_obj)
            except ValueError:
                pass
        
        records = query.all()
        
        return jsonify({
            'attendance': [r.to_dict() for r in records],
            'count': len(records)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/attendance', methods=['POST'])
@hr_required
def mark_attendance():
    """Mark attendance for staff"""
    try:
        data = request.get_json()
        
        required_fields = ['staff_id', 'attendance_date', 'status']
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if staff exists
        staff = StaffProfile.query.get(data['staff_id'])
        if not staff:
            return jsonify({'error': 'Staff not found'}), 404
        
        # Parse date
        try:
            attendance_date = datetime.strptime(data['attendance_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
        
        # Check if attendance already exists for this date
        existing = Attendance.query.filter_by(
            staff_id=data['staff_id'],
            attendance_date=attendance_date
        ).first()
        
        if existing:
            return jsonify({'error': 'Attendance already marked for this date'}), 409
        
        # Parse times if provided
        check_in_time = None
        check_out_time = None
        
        if data.get('check_in_time'):
            try:
                check_in_time = datetime.strptime(data['check_in_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'error': 'Invalid check-in time format'}), 400
        
        if data.get('check_out_time'):
            try:
                check_out_time = datetime.strptime(data['check_out_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'error': 'Invalid check-out time format'}), 400
        
        # Create attendance record
        attendance = Attendance(
            staff_id=data['staff_id'],
            attendance_date=attendance_date,
            check_in_time=check_in_time,
            check_out_time=check_out_time,
            status=data['status'],
            remarks=data.get('remarks')
        )
        
        db.session.add(attendance)
        db.session.commit()
        
        return jsonify({
            'message': 'Attendance marked successfully',
            'attendance': attendance.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/attendance/<int:attendance_id>', methods=['PUT'])
@hr_required
def update_attendance(attendance_id):
    """Update attendance record"""
    try:
        record = Attendance.query.get(attendance_id)
        if not record:
            return jsonify({'error': 'Attendance record not found'}), 404
        
        data = request.get_json()
        
        if 'status' in data:
            record.status = data['status']
        if 'remarks' in data:
            record.remarks = data['remarks']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Attendance updated successfully',
            'attendance': record.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== PAYROLL SUMMARY ====================

@hr_bp.route('/payroll', methods=['GET'])
@hr_required
def get_payroll_summary():
    """Get payroll summary"""
    try:
        staff_id = request.args.get('staff_id', type=int)
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        
        query = StaffProfile.query.filter_by(is_active=True)
        
        if staff_id:
            query = query.filter_by(id=staff_id)
        
        staff_members = query.all()
        
        payroll_data = []
        
        for staff in staff_members:
            # Get attendance for the month
            if month and year:
                start_date = date(year, month, 1)
                if month == 12:
                    end_date = date(year + 1, 1, 1) - timedelta(days=1)
                else:
                    end_date = date(year, month + 1, 1) - timedelta(days=1)
            else:
                today = date.today()
                start_date = date(today.year, today.month, 1)
                if today.month == 12:
                    end_date = date(today.year + 1, 1, 1) - timedelta(days=1)
                else:
                    end_date = date(today.year, today.month + 1, 1) - timedelta(days=1)
            
            attendance_records = Attendance.query.filter(
                Attendance.staff_id == staff.id,
                Attendance.attendance_date >= start_date,
                Attendance.attendance_date <= end_date
            ).all()
            
            present_days = sum(1 for r in attendance_records if r.status == 'Present')
            half_days = sum(1 for r in attendance_records if r.status == 'Half-day')
            absent_days = sum(1 for r in attendance_records if r.status == 'Absent')
            leave_days = sum(1 for r in attendance_records if r.status == 'Leave')
            
            payroll_data.append({
                'staff_id': staff.id,
                'employee_id': staff.employee_id,
                'name': f"{staff.user.first_name} {staff.user.last_name}",
                'department': staff.department,
                'position': staff.position,
                'salary': staff.salary,
                'present_days': present_days,
                'half_days': half_days,
                'absent_days': absent_days,
                'leave_days': leave_days,
                'total_working_days': present_days + half_days,
            })
        
        return jsonify({
            'payroll': payroll_data,
            'count': len(payroll_data),
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
