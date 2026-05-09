from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
import json

auth_bp = Blueprint('auth', __name__)

# In production, use a real database
USERS = {
    "admin@aquawatch.com": {
        "password": "admin123",
        "name": "Administrator",
        "role": "admin"
    },
    "user@aquawatch.com": {
        "password": "user123",
        "name": "Water Quality Officer",
        "role": "user"
    }
}

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if email in USERS and USERS[email]['password'] == password:
        access_token = create_access_token(
            identity=email,
            expires_delta=timedelta(hours=24)
        )
        return jsonify({
            'success': True,
            'access_token': access_token,
            'user': {
                'email': email,
                'name': USERS[email]['name'],
                'role': USERS[email]['role']
            }
        }), 200
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@auth_bp.route('/api/verify', methods=['GET'])
@jwt_required()
def verify():
    current_user = get_jwt_identity()
    return jsonify({
        'success': True,
        'user': {
            'email': current_user,
            'name': USERS.get(current_user, {}).get('name', 'User')
        }
    }), 200