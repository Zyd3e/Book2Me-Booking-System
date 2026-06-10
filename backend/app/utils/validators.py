from datetime import datetime, date


def validate_email(email):
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not any(char.isupper() for char in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(char.isdigit() for char in password):
        return False, "Password must contain at least one digit"
    return True, "Password is valid"


def validate_phone(phone):
    """Validate phone number format"""
    import re
    # Allow various phone formats
    pattern = r'^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$'
    return re.match(pattern, phone) is not None


def validate_dates(check_in_date, check_out_date):
    """Validate booking dates"""
    if isinstance(check_in_date, str):
        check_in_date = datetime.strptime(check_in_date, '%Y-%m-%d').date()
    if isinstance(check_out_date, str):
        check_out_date = datetime.strptime(check_out_date, '%Y-%m-%d').date()
    
    if check_in_date >= check_out_date:
        return False, "Check-out date must be after check-in date"
    
    if check_in_date < date.today():
        return False, "Check-in date cannot be in the past"
    
    return True, "Dates are valid"


def validate_positive_number(value, field_name):
    """Validate that a number is positive"""
    try:
        num = float(value)
        if num <= 0:
            return False, f"{field_name} must be a positive number"
        return True, "Valid"
    except (ValueError, TypeError):
        return False, f"{field_name} must be a valid number"


def validate_required_fields(data, required_fields):
    """Validate that required fields are present"""
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    return True, "All required fields present"
