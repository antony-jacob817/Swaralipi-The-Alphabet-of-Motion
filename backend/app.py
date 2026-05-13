# src/app.py
import os
import traceback
import json
import base64
import threading # <-- Added for our MediaPipe lock!
from datetime import datetime, timedelta
from io import BytesIO
from functools import wraps

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
import bcrypt
from dotenv import load_dotenv
from bson import ObjectId
import gridfs
from werkzeug.utils import secure_filename
import PyPDF2

import numpy as np
import cv2
import mediapipe as mp
import tensorflow as tf
from keras.src.ops.numpy import Any as KerasAny
import google.generativeai as genai

from services.cognition import get_answer
from services.gloss import to_gloss

# --- NEW: Custom wrapper from your infer_webcam.py script ---
class SafeAny(KerasAny):
    def __init__(self, *args, **kwargs):
        kwargs.pop('name', None)
        super().__init__(*args, **kwargs)

load_dotenv()

app = Flask(__name__)

# Configure CORS properly
CORS(app, 
     origins=[
         "http://localhost:5173", 
         "http://localhost:3000", 
         "https://antonyjacob817-swaralipi-api.hf.space", 
         "https://swaralipi-the-alphabet-of-motion.vercel.app" # <-- Added this!
     ],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     supports_credentials=True)

# MongoDB Configuration
MONGO_URI = os.getenv('MONGO_URI')

try:
    # Adjust path if your app.py is inside /src and models are in /backend/models
    MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend', 'models', 'final.keras')
    LABELS_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend', 'models', 'labels.json')
    
    # --- FIXED: Added the custom_objects wrapper ---
    sign_model = tf.keras.models.load_model(
        MODEL_PATH,
        custom_objects={"Any": SafeAny}
    )
    
    with open(LABELS_PATH, 'r') as f:
        sign_labels = json.load(f)
        # Convert list to dict if labels.json is an array: ["HELLO", "BOOK"] -> {0: "HELLO", 1: "BOOK"}
        if isinstance(sign_labels, list):
            sign_labels = {i: label for i, label in enumerate(sign_labels)}
            
    print("✅ Sign Language model loaded successfully!")
except Exception as e:
    print(f"⚠️ Warning: Could not load sign model. Error: {e}")
    # This will print the exact reason if it fails to load
    traceback.print_exc() 
    sign_model = None
    sign_labels = {}

if not MONGO_URI:
    print("❌ ERROR: MONGO_URI not found in .env file")
    print("💡 Make sure your .env file has: MONGO_URI=mongodb+srv://...")
    exit(1)

print("🔗 Attempting to connect to MongoDB...")

try:
    client = MongoClient(MONGO_URI)
    
    # Test the connection
    client.admin.command('ping')
    print("✅ MongoDB connected successfully!")
    
    # Get your database and collection
    db = client.Swaralipi
    users_collection = db.users
    subjects_collection = db.subjects
    progress_collection = db.progress
    activities_collection = db.activities
    achievements_collection = db.achievements
    pdfs_collection = db.pdfs
    doubts_collection = db.doubts
    
    print(f"📦 Using database: {db.name}")
    print(f"🗃️ Collections available: {db.list_collection_names()}")
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    exit(1)

# JSON encoder to handle ObjectId
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)

app.json_encoder = JSONEncoder
fs = gridfs.GridFS(db)

@app.route('/api/test', methods=['GET'])
def test_connection():
    """Test endpoint to verify everything is working"""
    try:
        return jsonify({
            "status": "success",
            "message": "✅ MongoDB connection is working!",
            "database": db.name,
            "collections": db.list_collection_names()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        print("📝 Registration attempt for:", data['email'])
        
        # Validate required fields
        required_fields = ['name', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'Missing required field: {field}'}), 400
        
        # Check if user already exists
        existing_user = users_collection.find_one({'email': data['email']})
        if existing_user:
            return jsonify({'message': 'User already exists'}), 400
        
        # Validate parent role
        if data['role'] == 'parent':
            if not data.get('linkedStudentEmail'):
                return jsonify({'message': 'Parents must provide a student email to link to'}), 400
            
            # Check if linked student exists
            student_user = users_collection.find_one({
                'email': data['linkedStudentEmail'],
                'role': 'student'
            })
            if not student_user:
                return jsonify({'message': 'Linked student email not found or not a student account'}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        # Create user object
        user = {
            'name': data['name'],
            'email': data['email'],
            'password': hashed_password.decode('utf-8'),
            'role': data['role'],
            'linkedStudentEmail': data.get('linkedStudentEmail', ''),
            'createdAt': datetime.utcnow(),  # Fixed: datetime.datetime.utcnow() -> datetime.utcnow()
            'points': 0,
            'currentStreak': 0,
            'totalProgress': 0
        }
        
        # Insert user
        result = users_collection.insert_one(user)
        
        # Create initial progress record ONLY for students
        if data['role'] == 'student':
            progress_data = {
                'userId': result.inserted_id,
                'subjects': [],
                'totalProgress': 0,
                'lastActive': datetime.utcnow()  # Fixed: datetime.datetime.utcnow() -> datetime.utcnow()
            }
            progress_collection.insert_one(progress_data)
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': str(result.inserted_id),
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        }), 201
        
    except Exception as e:
        print("❌ Registration error:", str(e))
        print(traceback.format_exc())  # Add this for detailed error logging
        return jsonify({'message': 'Registration failed. Please try again.'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Find user
        user = users_collection.find_one({'email': data['email']})
        
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Check password
        if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # If role is specified in login, verify it matches
        if data.get('role') and user['role'] != data['role']:
            return jsonify({'message': f'Please login as {user["role"]}'}), 401
        
        # Update last login time - FIXED THIS LINE
        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {'lastLogin': datetime.utcnow()}}  # Changed datetime.datetime.utcnow() to datetime.utcnow()
        )
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200
        
    except Exception as e:
        print("❌ Login error:", str(e))
        print(traceback.format_exc())  # Add this for better error details
        return jsonify({'message': 'Login failed. Please try again.'}), 500

@app.route('/api/admin/create-admin', methods=['POST'])
def create_admin_account():
    """Secure endpoint to create admin accounts with multiple verification layers"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password', 'requesterEmail', 'adminSecret']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'Missing required field: {field}'}), 400
        
        # Layer 1: Verify admin creation secret
        if data['adminSecret'] != os.getenv('ADMIN_CREATION_SECRET'):
            return jsonify({'message': 'Invalid admin secret'}), 403
        
        # Layer 2: Verify requester is already a super admin
        requester = users_collection.find_one({'email': data['requesterEmail'], 'role': 'admin'})
        if not requester or not requester.get('isSuperAdmin'):
            return jsonify({'message': 'Unauthorized: Only super admins can create new admin accounts'}), 403
        
        # Layer 3: Check if target email is in pre-approved super admin list
        super_admin_emails = os.getenv('SUPER_ADMIN_EMAILS', '').split(',')
        is_super_admin = data['email'] in super_admin_emails
        
        # Layer 4: Check if user already exists
        existing_user = users_collection.find_one({'email': data['email']})
        if existing_user:
            return jsonify({'message': 'User already exists'}), 400
        
        # Hash password with stronger rounds (adjust based on your security needs)
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt(rounds=12))
        
        # Create admin user with additional security fields
        admin_user = {
            'name': data['name'],
            'email': data['email'],
            'password': hashed_password.decode('utf-8'),
            'role': 'admin',
            'isSuperAdmin': is_super_admin,
            'createdBy': data['requesterEmail'],
            'createdAt': datetime.utcnow(),
            'lastPasswordChange': datetime.utcnow(),
            'accountStatus': 'active',
            'permissions': {
                'manageUsers': True,
                'manageContent': True,
                'viewAnalytics': True,
                'manageSettings': is_super_admin  # Only super admins can manage settings
            }
        }
        
        # Insert admin
        result = users_collection.insert_one(admin_user)
        
        # Log the admin creation event
        print(f"🔐 Admin account created: {data['email']} by {data['requesterEmail']}")
        
        return jsonify({
            'message': 'Admin account created successfully',
            'user': {
                'id': str(result.inserted_id),
                'name': admin_user['name'],
                'email': admin_user['email'],
                'role': admin_user['role'],
                'isSuperAdmin': admin_user['isSuperAdmin']
            }
        }), 201
        
    except Exception as e:
        print("❌ Admin creation error:", str(e))
        # Don't reveal specific error details in production
        return jsonify({'message': 'Account creation failed'}), 500
    
@app.route('/api/change-password', methods=['POST'])
def change_password():
    """Change user password"""
    try:
        data = request.get_json()

        if not data.get('userId') or not data.get('currentPassword') or not data.get('newPassword'):
            return jsonify({'message': 'User ID, current password, and new password are required'}), 400

        # Find user
        user = users_collection.find_one({'_id': ObjectId(data['userId'])})
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Verify current password
        if not bcrypt.checkpw(data['currentPassword'].encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': 'Current password is incorrect'}), 401

        # Hash new password
        hashed_password = bcrypt.hashpw(data['newPassword'].encode('utf-8'), bcrypt.gensalt())

        # Update password
        result = users_collection.update_one(
            {'_id': ObjectId(data['userId'])},
            {'$set': {'password': hashed_password.decode('utf-8')}}
        )

        if result.matched_count == 0:
            return jsonify({'message': 'User not found'}), 404

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        print("❌ Change password error:", str(e))
        return jsonify({'message': 'Failed to change password'}), 500

# Helper function to calculate weekly activity
def calculate_weekly_activity(activities):
    """Calculate weekly study activity from real data"""
    weekly_activity = [
        {'day': 'Mon', 'hours': 0},
        {'day': 'Tue', 'hours': 0},
        {'day': 'Wed', 'hours': 0},
        {'day': 'Thu', 'hours': 0},
        {'day': 'Fri', 'hours': 0},
        {'day': 'Sat', 'hours': 0},
        {'day': 'Sun', 'hours': 0}
    ]
    
    # Group activities by day of week
    for activity in activities:
        if 'timestamp' in activity and 'duration' in activity:
            activity_date = activity['timestamp']
            day_of_week = activity_date.strftime('%a')
            duration_hours = activity['duration'] / 60  # Convert minutes to hours
            
            # Find the day in weekly_activity and add duration
            for day in weekly_activity:
                if day['day'] == day_of_week:
                    day['hours'] += duration_hours
                    break
    
    return weekly_activity

# Helper function to get subject color
def get_subject_color(subject_name):
    """Get consistent color for each subject"""
    color_map = {
        'Mathematics': 'bg-blue-500',
        'Science': 'bg-green-500',
        'English': 'bg-purple-500',
        'Environmental Studies': 'bg-orange-500',
        'History': 'bg-red-500',
        'Geography': 'bg-yellow-500'
    }
    return color_map.get(subject_name, 'bg-gray-500')

# Helper function to calculate achievements
def get_student_achievements(user, progress, activities):
    """Calculate real achievements based on student data"""
    achievements = []
    
    # Math Master achievement
    if progress and 'subjects' in progress:
        math_subject = next((s for s in progress['subjects'] if s['name'] == 'Mathematics'), None)
        if math_subject and math_subject.get('completedChapters', 0) >= 10:
            achievements.append({
                'title': 'Math Master',
                'description': f"Completed {math_subject['completedChapters']} math chapters",
                'icon': 'Award',
                'color': 'from-yellow-50 to-orange-50'
            })
    
    # Study Streak achievement
    streak = user.get('currentStreak', 0)
    if streak >= 7:
        achievements.append({
            'title': 'Study Streak',
            'description': f"{streak} days of consistent learning",
            'icon': 'Target',
            'color': 'from-blue-50 to-purple-50'
        })
    
    # Bookworm achievement
    total_chapters = 0
    if progress and 'subjects' in progress:
        total_chapters = sum(s.get('completedChapters', 0) for s in progress['subjects'])
    
    if total_chapters >= 20:
        achievements.append({
            'title': 'Bookworm',
            'description': f"Completed {total_chapters}+ chapters",
            'icon': 'BookOpen',
            'color': 'from-green-50 to-teal-50'
        })
    
    # Time Investor achievement
    total_study_minutes = sum(activity.get('duration', 0) for activity in activities)
    if total_study_minutes >= 600:  # 10 hours
        achievements.append({
            'title': 'Time Investor',
            'description': "10+ hours of learning this week",
            'icon': 'Clock',
            'color': 'from-purple-50 to-pink-50'
        })
    
    return achievements

# My Progress Endpoint - REAL DATA
@app.route('/api/student/progress/<student_id>', methods=['GET'])
def student_progress(student_id):
    """Get detailed progress data for student progress page"""
    try:
        # Get user info
        user = users_collection.find_one({'_id': ObjectId(student_id)})
        if not user:
            return jsonify({'message': 'Student not found'}), 404
        
        # Get progress data
        progress = progress_collection.find_one({'userId': ObjectId(student_id)})
        
        # Get activities for weekly calculation
        activities = list(activities_collection.find(
            {'userId': ObjectId(student_id), 'type': 'study'},
            {'timestamp': 1, 'duration': 1}
        ).sort('timestamp', -1).limit(100))
        
        # Calculate weekly activity
        weekly_activity = calculate_weekly_activity(activities)
        
        # Calculate total weekly time
        weekly_total_minutes = sum(day['hours'] * 60 for day in weekly_activity)
        weekly_total_hours = weekly_total_minutes // 60
        weekly_total_minutes_remainder = weekly_total_minutes % 60
        weekly_total = f"{weekly_total_hours}h {weekly_total_minutes_remainder}m"
        
        # Calculate average daily time
        if activities:
            total_study_minutes = sum(activity.get('duration', 0) for activity in activities)
            avg_daily_minutes = total_study_minutes / max(len(activities), 1)
            avg_daily_hours = int(avg_daily_minutes // 60)
            avg_daily_minutes_remainder = int(avg_daily_minutes % 60)
            avg_daily_time = f"{avg_daily_hours}h {avg_daily_minutes_remainder}m"
        else:
            avg_daily_time = "0h 0m"
        
        # Calculate subject progress from real data
        subjects_progress = []
        chapters_completed = 0
        
        if progress and 'subjects' in progress:
            for subject in progress['subjects']:
                subjects_progress.append({
                    'name': subject['name'],
                    'progress': subject.get('progress', 0),
                    'completedChapters': subject.get('completedChapters', 0),
                    'totalChapters': subject.get('totalChapters', 0),
                    'lastActivity': subject.get('lastActivity', datetime.utcnow().isoformat()),
                    'color': get_subject_color(subject['name'])
                })
                chapters_completed += subject.get('completedChapters', 0)
        
        # Get real achievements
        achievements = get_student_achievements(user, progress, activities)
        
        response_data = {
            'name': user['name'],
            'overallProgress': user.get('totalProgress', 0),
            'points': user.get('points', 0),
            'streak': user.get('currentStreak', 0),
            'weeklyTotal': weekly_total,
            'chaptersCompleted': chapters_completed,
            'avgDailyTime': avg_daily_time,
            'subjects': subjects_progress,
            'weeklyActivity': weekly_activity,
            'achievements': achievements
        }
        
        return jsonify(response_data), 200
    except Exception as e:
        print(f"❌ Error in student_progress: {str(e)}")
        return jsonify({'message': 'Failed to fetch student progress data'}), 500

# Download PDF
@app.route('/api/pdf/<pdf_id>', methods=['GET'])
def download_pdf(pdf_id):
    """Download a PDF file with proper headers for iframe display"""
    try:
        pdf_file = fs.get(ObjectId(pdf_id))
        
        # Set proper headers for PDF display
        response = send_file(
            pdf_file,
            download_name=pdf_file.filename,
            as_attachment=False,  # Change to False for iframe display
            mimetype='application/pdf'
        )
        
        # Add headers to allow iframe embedding
        response.headers['X-Frame-Options'] = 'ALLOWALL'
        response.headers['Content-Security-Policy'] = "frame-ancestors 'self' http://localhost:5173 http://localhost:3000"
        
        return response
    except Exception as e:
        print(f"❌ Error in download_pdf: {str(e)}")
        return jsonify({'message': 'PDF not found'}), 404
    
# Get all PDFs with proper data
@app.route('/api/pdfs', methods=['GET'])
def get_pdfs():
    """Get all PDF documents with proper metadata"""
    try:
        # Get all subjects with their chapters
        subjects = list(subjects_collection.find({}))
        
        pdfs = []
        for subject in subjects:
            for chapter in subject.get('chapters', []):
                # Calculate file size (approximate)
                try:
                    pdf_file = fs.get(ObjectId(chapter.get('pdfId')))
                    file_size = f"{(pdf_file.length / 1024 / 1024):.1f} MB"
                except:
                    file_size = "Unknown"
                
                pdfs.append({
                    '_id': chapter.get('pdfId'),
                    'id': chapter.get('pdfId'),
                    'title': f"{chapter['name']} - {subject['name']}",
                    'subject': subject['name'],
                    'chapter': chapter['name'],
                    'grade': chapter.get('source', 'Not specified'),
                    'fileSize': file_size,
                    'uploadDate': chapter.get('uploadDate', datetime.utcnow()).isoformat(),
                    'downloadUrl': f"/api/pdf/{chapter.get('pdfId')}",
                    'viewUrl': f"/api/pdf/{chapter.get('pdfId')}"
                })
        
        return jsonify(pdfs), 200
    except Exception as e:
        print(f"❌ Error in get_pdfs: {str(e)}")
        return jsonify({'message': 'Failed to fetch PDFs'}), 500

@app.route('/api/pdf-text/<pdf_id>', methods=['GET'])
def get_pdf_text(pdf_id):
    """Extract text from PDF for teaching mode - IMPROVED VERSION"""
    try:
        # Get PDF from GridFS
        pdf_file = fs.get(ObjectId(pdf_id))
        
        # Extract text from PDF with better error handling
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_file.read()))
        text = ""
        
        for page_num in range(len(pdf_reader.pages)):
            try:
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            except Exception as page_error:
                print(f"Warning: Could not extract text from page {page_num}: {page_error}")
                continue
        
        # Clean up text
        if text.strip():
            text = text.replace('\r\n', ' ').replace('\n', ' ')
            # Remove extra spaces
            text = ' '.join(text.split())
        else:
            text = "Text extraction failed or PDF contains only images."
        
        return jsonify({
            'success': True,
            'text': text,
            'pageCount': len(pdf_reader.pages),
            'extractedLength': len(text)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_pdf_text: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to extract text from PDF',
            'error': str(e)
        }), 500

# Teaching Mode Endpoints - REAL DATA
@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    """Get all subjects with their chapters"""
    try:
        subjects = list(subjects_collection.find({}))
        
        # Convert ObjectId to string
        for subject in subjects:
            subject['_id'] = str(subject['_id'])
            # Ensure chapters array exists
            subject.setdefault('chapters', [])
            
        return jsonify(subjects), 200
    except Exception as e:
        print(f"❌ Error in get_subjects: {str(e)}")
        return jsonify({'message': 'Failed to fetch subjects'}), 500

@app.route('/api/subjects', methods=['POST'])
def add_subject():
    """Add a new subject with PDF file"""
    try:
        # Check if subject already exists
        existing_subject = subjects_collection.find_one({'name': request.form['subjectName']})
        if existing_subject:
            return jsonify({'message': 'Subject already exists'}), 400
        
        # Handle file upload
        if 'pdf' not in request.files:
            return jsonify({'message': 'No PDF file provided'}), 400
        
        pdf_file = request.files['pdf']
        if pdf_file.filename == '':
            return jsonify({'message': 'No PDF file selected'}), 400
        
        if pdf_file and pdf_file.filename.endswith('.pdf'):
            # Store PDF in GridFS
            pdf_id = fs.put(pdf_file, filename=secure_filename(pdf_file.filename))
            
            # Create subject document
            subject = {
                'name': request.form['subjectName'],
                'chapters': [{
                    'name': request.form['chapterName'],
                    'source': request.form['source'],
                    'pdfId': str(pdf_id),
                    'fileName': secure_filename(pdf_file.filename),
                    'uploadDate': datetime.utcnow()
                }],
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            # Insert subject
            result = subjects_collection.insert_one(subject)
            subject['_id'] = str(result.inserted_id)
            
            return jsonify({
                'message': 'Subject and chapter added successfully',
                'subject': subject
            }), 201
        else:
            return jsonify({'message': 'Invalid file type. Please upload a PDF'}), 400
            
    except Exception as e:
        print(f"❌ Error in add_subject: {str(e)}")
        return jsonify({'message': 'Failed to add subject'}), 500
    # Edit Subject
@app.route('/api/subjects/<subject_id>', methods=['PUT'])
def update_subject(subject_id):
    """Update subject name"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'message': 'Subject name is required'}), 400
        
        # Check if subject exists
        subject = subjects_collection.find_one({'_id': ObjectId(subject_id)})
        if not subject:
            return jsonify({'message': 'Subject not found'}), 404
        
        # Update subject name
        result = subjects_collection.update_one(
            {'_id': ObjectId(subject_id)},
            {'$set': {
                'name': data['name'],
                'updatedAt': datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({'message': 'Subject not found'}), 404
            
        return jsonify({'message': 'Subject updated successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error in update_subject: {str(e)}")
        return jsonify({'message': 'Failed to update subject'}), 500

# Edit Chapter
@app.route('/api/subjects/<subject_id>/chapters/<int:chapter_index>', methods=['PUT'])
def update_chapter(subject_id, chapter_index):
    """Update chapter details"""
    try:
        # Check if subject exists
        subject = subjects_collection.find_one({'_id': ObjectId(subject_id)})
        if not subject:
            return jsonify({'message': 'Subject not found'}), 404
        
        # Check if chapter exists
        if chapter_index >= len(subject.get('chapters', [])):
            return jsonify({'message': 'Chapter not found'}), 404
        
        # Prepare update data
        update_data = {
            f'chapters.{chapter_index}.name': request.form['chapterName'],
            f'chapters.{chapter_index}.source': request.form['source'],
            'updatedAt': datetime.utcnow()
        }
        
        # Handle file upload if provided
        if 'pdf' in request.files and request.files['pdf'].filename != '':
            pdf_file = request.files['pdf']
            if pdf_file and pdf_file.filename.endswith('.pdf'):
                # Store new PDF in GridFS
                pdf_id = fs.put(pdf_file, filename=secure_filename(pdf_file.filename))
                update_data[f'chapters.{chapter_index}.pdfId'] = str(pdf_id)
                update_data[f'chapters.{chapter_index}.fileName'] = secure_filename(pdf_file.filename)
            else:
                return jsonify({'message': 'Invalid file type. Please upload a PDF'}), 400
        
        # Update chapter
        result = subjects_collection.update_one(
            {'_id': ObjectId(subject_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'message': 'Subject not found'}), 404
            
        return jsonify({'message': 'Chapter updated successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error in update_chapter: {str(e)}")
        return jsonify({'message': 'Failed to update chapter'}), 500

# Delete Subject
@app.route('/api/subjects/<subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    """Delete a subject and all its chapters"""
    try:
        # Check if subject exists
        subject = subjects_collection.find_one({'_id': ObjectId(subject_id)})
        if not subject:
            return jsonify({'message': 'Subject not found'}), 404
        
        # Delete PDF files from GridFS
        for chapter in subject.get('chapters', []):
            try:
                fs.delete(ObjectId(chapter.get('pdfId')))
            except:
                pass  # Ignore errors if file doesn't exist
        
        # Delete subject
        result = subjects_collection.delete_one({'_id': ObjectId(subject_id)})
        
        if result.deleted_count == 0:
            return jsonify({'message': 'Subject not found'}), 404
            
        return jsonify({'message': 'Subject deleted successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error in delete_subject: {str(e)}")
        return jsonify({'message': 'Failed to delete subject'}), 500

# Delete Chapter
@app.route('/api/subjects/<subject_id>/chapters/<int:chapter_index>', methods=['DELETE'])
def delete_chapter(subject_id, chapter_index):
    """Delete a chapter from a subject"""
    try:
        # Check if subject exists
        subject = subjects_collection.find_one({'_id': ObjectId(subject_id)})
        if not subject:
            return jsonify({'message': 'Subject not found'}), 404
        
        # Check if chapter exists
        if chapter_index >= len(subject.get('chapters', [])):
            return jsonify({'message': 'Chapter not found'}), 404
        
        # Get chapter to delete PDF file
        chapter_to_delete = subject['chapters'][chapter_index]
        
        # Delete PDF file from GridFS
        try:
            fs.delete(ObjectId(chapter_to_delete.get('pdfId')))
        except:
            pass  # Ignore errors if file doesn't exist
        
        # Remove chapter from array
        result = subjects_collection.update_one(
            {'_id': ObjectId(subject_id)},
            {'$pull': {'chapters': {'$exists': True}}}
        )
        
        # Rebuild chapters array without the deleted one
        updated_chapters = [chap for i, chap in enumerate(subject['chapters']) if i != chapter_index]
        
        subjects_collection.update_one(
            {'_id': ObjectId(subject_id)},
            {'$set': {'chapters': updated_chapters, 'updatedAt': datetime.utcnow()}}
        )
        
        return jsonify({'message': 'Chapter deleted successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error in delete_chapter: {str(e)}")
        return jsonify({'message': 'Failed to delete chapter'}), 500
    
@app.route('/api/subjects/<subject_id>/chapters', methods=['POST'])
def add_chapter(subject_id):
    """Add a chapter to an existing subject"""
    try:
        # Check if subject exists
        subject = subjects_collection.find_one({'_id': ObjectId(subject_id)})
        if not subject:
            return jsonify({'message': 'Subject not found'}), 404
        
        # Handle file upload
        if 'pdf' not in request.files:
            return jsonify({'message': 'No PDF file provided'}), 400
        
        pdf_file = request.files['pdf']
        if pdf_file.filename == '':
            return jsonify({'message': 'No PDF file selected'}), 400
        
        if pdf_file and pdf_file.filename.endswith('.pdf'):
            # Store PDF in GridFS
            pdf_id = fs.put(pdf_file, filename=secure_filename(pdf_file.filename))
            
            # Create chapter
            chapter = {
                'name': request.form['chapterName'],
                'source': request.form['source'],
                'pdfId': str(pdf_id),
                'fileName': secure_filename(pdf_file.filename),
                'uploadDate': datetime.utcnow()
            }
            
            # Add chapter to subject
            subjects_collection.update_one(
                {'_id': ObjectId(subject_id)},
                {
                    '$push': {'chapters': chapter},
                    '$set': {'updatedAt': datetime.utcnow()}
                }
            )
            
            return jsonify({
                'message': 'Chapter added successfully',
                'chapter': chapter
            }), 201
        else:
            return jsonify({'message': 'Invalid file type. Please upload a PDF'}), 400
            
    except Exception as e:
        print(f"❌ Error in add_chapter: {str(e)}")
        return jsonify({'message': 'Failed to add chapter'}), 500

# Student Dashboard Endpoint - REAL DATA (updated)
@app.route('/api/student/dashboard/<student_id>', methods=['GET'])
def student_dashboard(student_id):
    """Get comprehensive student dashboard data with real calculations"""
    try:
        # Get user info
        user = users_collection.find_one({'_id': ObjectId(student_id)})
        if not user:
            return jsonify({'message': 'Student not found'}), 404        
        # Get progress data
        progress = progress_collection.find_one({'userId': ObjectId(student_id)})
        
        # Get activities for time calculations
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        weekly_activities = list(activities_collection.find({
            'userId': ObjectId(student_id),
            'type': 'study',
            'timestamp': {'$gte': one_week_ago}
        }))
        
        # Calculate weekly time
        weekly_minutes = sum(activity.get('duration', 0) for activity in weekly_activities)
        weekly_hours = weekly_minutes // 60
        weekly_minutes_remainder = weekly_minutes % 60
        weekly_time = f"{weekly_hours}h {weekly_minutes_remainder}m"
        
        # Calculate average daily time (last 7 days)
        if weekly_activities:
            avg_daily_minutes = weekly_minutes / 7
            avg_daily_hours = int(avg_daily_minutes // 60)
            avg_daily_minutes_remainder = int(avg_daily_minutes % 60)
            avg_daily_time = f"{avg_daily_hours}h {avg_daily_minutes_remainder}m"
        else:
            avg_daily_time = "0h 0m"
        
        # Calculate chapters completed from progress data
        chapters_completed = 0
        subjects_progress = []
        
        if progress and 'subjects' in progress:
            for subject in progress['subjects']:
                chapters_completed += subject.get('completedChapters', 0)
                subjects_progress.append({
                    'name': subject['name'],
                    'progress': subject.get('progress', 0),
                    'completedChapters': subject.get('completedChapters', 0),
                    'totalChapters': subject.get('totalChapters', 0)
                })
        
        response_data = {
            'name': user['name'],
            'totalProgress': user.get('totalProgress', 0),
            'pointsEarned': user.get('points', 0),
            'currentStreak': user.get('currentStreak', 0),
            'weeklyTime': weekly_time,
            'chaptersCompleted': chapters_completed,
            'avgDailyTime': avg_daily_time,
            'subjects': subjects_progress
        }
        
        return jsonify(response_data), 200
    except Exception as e:
        print(f"❌ Error in student_dashboard: {str(e)}")
        return jsonify({'message': 'Failed to fetch student dashboard data'}), 500

def require_admin(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Authorization header required'}), 401
        
        try:
            # Extract user ID from token (you'll need to implement JWT or session tokens)
            user_id = auth_header.split(' ')[1]  # Simplified example
            
            user = users_collection.find_one({'_id': ObjectId(user_id)})
            if not user or user['role'] != 'admin':
                return jsonify({'message': 'Admin access required'}), 403
                
        except Exception as e:
            return jsonify({'message': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    return decorated_function

# Admin Dashboard Endpoint - REAL DATA
@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    """Get admin dashboard statistics with real calculations"""
    try:
        # Real counts from database
        total_students = users_collection.count_documents({'role': 'student'})
        total_parents = users_collection.count_documents({'role': 'parent'})
        total_subjects = subjects_collection.count_documents({})
        
        # Count pending doubts
        total_doubts = doubts_collection.count_documents({'status': 'pending'})
        
        # Count active students (students with activity in last 7 days)
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        active_students = users_collection.count_documents({
            'role': 'student',
            'lastLogin': {'$gte': one_week_ago}
        })
        
        stats = {
            'totalUsers': total_students + total_parents,
            'totalSubjects': total_subjects,
            'totalDoubts': total_doubts,
            'activeStudents': active_students
        }
        
        return jsonify(stats), 200
    except Exception as e:
        print(f"❌ Error in admin_dashboard: {str(e)}")
        return jsonify({'message': 'Failed to fetch admin dashboard data'}), 500

# Users Endpoint
@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """Get all users for admin management"""
    try:
        users = list(users_collection.find({}, {
            'password': 0,
            'linkedStudentEmail': 0
        }))
        
        # Convert ObjectId to string
        for user in users:
            user['_id'] = str(user['_id'])
            user['joinDate'] = user.get('createdAt', datetime.utcnow()).strftime('%Y-%m-%d')
            user['status'] = 'active' if user.get('lastLogin') and (
                datetime.utcnow() - user['lastLogin'] < timedelta(days=30)
            ) else 'inactive'
        
        return jsonify(users), 200
    except Exception as e:
        print(f"❌ Error in get_all_users: {str(e)}")
        return jsonify({'message': 'Failed to fetch users'}), 500

# Doubts Endpoint
@app.route('/api/doubts', methods=['GET'])
def get_all_doubts():
    """Get all student doubts"""
    try:
        doubts = list(doubts_collection.find({}))
        
        # Convert ObjectId to string and format data
        for doubt in doubts:
            doubt['_id'] = str(doubt['_id'])
            doubt['timestamp'] = doubt.get('createdAt', datetime.utcnow()).isoformat()
            
        return jsonify(doubts), 200
    except Exception as e:
        print(f"❌ Error in get_all_doubts: {str(e)}")
        return jsonify({'message': 'Failed to fetch doubts'}), 500

# Student Progress for Admin - REAL DATA
@app.route('/api/admin/student-progress', methods=['GET'])
def get_all_student_progress():
    """Get progress data for all students with real calculations"""
    try:
        # Get all students
        students = list(users_collection.find({'role': 'student'}, {
            'name': 1,
            'email': 1,
            'lastLogin': 1
        }))
        
        progress_data = []
        
        for student in students:
            # Get progress for each student
            progress = progress_collection.find_one({'userId': student['_id']})
            
            if progress and 'subjects' in progress:
                for subject in progress['subjects']:
                    progress_data.append({
                        'studentId': str(student['_id']),
                        'studentName': student['name'],
                        'subject': subject['name'],
                        'progress': subject.get('progress', 0),
                        'chaptersCompleted': subject.get('completedChapters', 0),
                        'totalChapters': subject.get('totalChapters', 0),
                        'lastActivity': student.get('lastLogin', datetime.utcnow()).isoformat()
                    })
        
        return jsonify(progress_data), 200
    except Exception as e:
        print(f"❌ Error in get_all_student_progress: {str(e)}")
        return jsonify({'message': 'Failed to fetch student progress data'}), 500

# Update Doubt Status Endpoint
@app.route('/api/doubts/<doubt_id>', methods=['PUT'])
def update_doubt_status(doubt_id):
    """Update doubt status"""
    try:
        data = request.get_json()
        if not data.get('status'):
            return jsonify({'message': 'Status is required'}), 400
            
        result = doubts_collection.update_one(
            {'_id': ObjectId(doubt_id)},
            {'$set': {
                'status': data['status'],
                'resolvedAt': datetime.utcnow() if data['status'] == 'resolved' else None,
                'response': data.get('response')
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({'message': 'Doubt not found'}), 404
            
        return jsonify({'message': 'Doubt status updated successfully'}), 200
    except Exception as e:
        print(f"❌ Error in update_doubt_status: {str(e)}")
        return jsonify({'message': 'Failed to update doubt status'}), 500

@app.route('/api/doubts', methods=['POST'])
def create_doubt():
    """Create a new doubt/question from student"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('studentId') or not data.get('question'):
            return jsonify({'message': 'Student ID and question are required'}), 400
        
        # Get student info
        student = users_collection.find_one({'_id': ObjectId(data['studentId'])})
        if not student:
            return jsonify({'message': 'Student not found'}), 404
        
        # Create doubt document
        doubt = {
            'studentId': data['studentId'],
            'studentName': data.get('studentName', student['name']),
            'studentEmail': student['email'],
            'subject': data.get('subject', ''),
            'question': data['question'],
            'status': 'pending',
            'createdAt': datetime.utcnow(),
            'resolvedAt': None,
            'response': None
        }
        
        # Insert doubt
        result = doubts_collection.insert_one(doubt)
        
        return jsonify({
            'message': 'Doubt submitted successfully',
            'doubtId': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"❌ Error in create_doubt: {str(e)}")
        return jsonify({'message': 'Failed to submit doubt'}), 500

# Update user activity tracking
@app.route('/api/activity', methods=['POST'])
def track_activity():
    """Track student learning activity"""
    try:
        data = request.get_json()
        
        activity = {
            'userId': ObjectId(data['userId']),
            'type': data['type'],  # 'study', 'quiz', 'reading', etc.
            'duration': data.get('duration', 0),  # in minutes
            'subject': data.get('subject', ''),
            'chapter': data.get('chapter', ''),
            'timestamp': datetime.utcnow()
        }
        
        result = activities_collection.insert_one(activity)
        
        # Update user's last login and potentially streak
        users_collection.update_one(
            {'_id': ObjectId(data['userId'])},
            {'$set': {'lastLogin': datetime.utcnow()}}
        )
        
        return jsonify({
            'message': 'Activity tracked successfully',
            'activityId': str(result.inserted_id)
        }), 201
    except Exception as e:
        print(f"❌ Error in track_activity: {str(e)}")
        return jsonify({'message': 'Failed to track activity'}), 500

def calculate_total_progress(progress, update_data):
    """Calculate overall progress across all subjects"""
    if 'subjects' not in progress or not progress['subjects']:
        return 0
    
    total_progress = 0
    total_weight = 0
    
    for subject in progress['subjects']:
        # Each subject contributes equally to total progress
        total_progress += subject.get('progress', 0)
        total_weight += 1
    
    if total_weight > 0:
        return int(total_progress / total_weight)
    return 0

# Update progress when chapter is completed
# Update progress when chapter is completed
@app.route('/api/progress/complete-chapter', methods=['POST'])
def complete_chapter():
    """Update progress when a chapter is completed"""
    try:
        data = request.get_json()
        
        # Find the progress document
        progress = progress_collection.find_one({'userId': ObjectId(data['userId'])})
        
        if not progress:
            # Create new progress document if it doesn't exist
            progress = {
                'userId': ObjectId(data['userId']),
                'subjects': [],
                'totalProgress': 0,
                'lastActive': datetime.utcnow()
            }
            progress_collection.insert_one(progress)
            progress = progress_collection.find_one({'userId': ObjectId(data['userId'])})
        
        # Initialize update data
        update_data = {}
        
        # Update subject progress
        subject_index = -1
        if 'subjects' in progress:
            for i, subject in enumerate(progress['subjects']):
                if subject['name'] == data['subject']:
                    subject_index = i
                    break
        
        if subject_index >= 0:
            # Update existing subject
            completed_chapters = progress['subjects'][subject_index].get('completedChapters', 0) + 1
            total_chapters = progress['subjects'][subject_index].get('totalChapters', 10)  # Default to 10 if not set
            
            update_data = {
                f'subjects.{subject_index}.completedChapters': completed_chapters,
                f'subjects.{subject_index}.lastActivity': datetime.utcnow().isoformat(),
                f'subjects.{subject_index}.progress': min(100, int((completed_chapters / total_chapters) * 100))
            }
            
        else:
            # Add new subject
            new_subject = {
                'name': data['subject'],
                'progress': 10,  # Starting progress
                'completedChapters': 1,
                'totalChapters': 10,  # Default, should be updated with real data
                'lastActivity': datetime.utcnow().isoformat()
            }
            update_data = {'$push': {'subjects': new_subject}}
        
        # Calculate overall progress
        total_progress = calculate_total_progress(progress, update_data)
        update_data['totalProgress'] = total_progress
        update_data['lastActive'] = datetime.utcnow()
        
        # Update database
        progress_collection.update_one(
            {'userId': ObjectId(data['userId'])},
            {'$set': update_data}
        )
        
        # Award points for completion
        users_collection.update_one(
            {'_id': ObjectId(data['userId'])},
            {'$inc': {'points': 10}}  # 10 points per chapter
        )
        
        return jsonify({'message': 'Chapter completed successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error in complete_chapter: {str(e)}")
        return jsonify({'message': 'Failed to update progress'}), 500

@app.route('/api/user/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user data by ID"""
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)}, {'password': 0})
        if not user:
            return jsonify({'message': 'User not found'}), 404

        user_data = {
            'id': str(user['_id']),
            'name': user.get('name', ''),
            'email': user.get('email', ''),
            'role': user.get('role', 'user'),
            'createdAt': user.get('createdAt', '')  # Include createdAt field
        }

        return jsonify(user_data), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch user data'}), 500

# Get parent's linked student data
@app.route('/api/parent/student/<parent_id>', methods=['GET'])
def get_parent_student(parent_id):
    """Get the student linked to a parent"""
    try:
        # Find the parent
        parent = users_collection.find_one({'_id': ObjectId(parent_id)})
        if not parent or parent['role'] != 'parent':
            return jsonify({'message': 'Parent not found'}), 404
        
        # Find the linked student
        student = users_collection.find_one({'email': parent['linkedStudentEmail']})
        if not student:
            return jsonify({'message': 'Linked student not found'}), 404
        
        # Get student progress
        progress = progress_collection.find_one({'userId': student['_id']})
        
        # Get student activities for the week
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        weekly_activities = list(activities_collection.find({
            'userId': student['_id'],
            'type': 'study',
            'timestamp': {'$gte': one_week_ago}
        }))
        
        # Calculate weekly time
        weekly_minutes = sum(activity.get('duration', 0) for activity in weekly_activities)
        weekly_hours = weekly_minutes // 60
        weekly_minutes_remainder = weekly_minutes % 60
        weekly_time = f"{weekly_hours}h {weekly_minutes_remainder}m"
        
        # Calculate chapters completed
        chapters_completed = 0
        subjects_progress = []
        
        if progress and 'subjects' in progress:
            for subject in progress['subjects']:
                chapters_completed += subject.get('completedChapters', 0)
                subjects_progress.append({
                    'name': subject['name'],
                    'progress': subject.get('progress', 0),
                    'completedChapters': subject.get('completedChapters', 0),
                    'totalChapters': subject.get('totalChapters', 0)
                })
        
        student_data = {
            'id': str(student['_id']),
            'name': student['name'],
            'email': student['email'],
            'grade': student.get('grade', 'Not specified'),
            'overallProgress': student.get('totalProgress', 0),
            'points': student.get('points', 0),
            'currentStreak': student.get('currentStreak', 0),
            'weeklyTime': weekly_time,
            'chaptersCompleted': chapters_completed,
            'subjects': subjects_progress
        }
        
        return jsonify(student_data), 200
        
    except Exception as e:
        print(f"❌ Error in get_parent_student: {str(e)}")
        return jsonify({'message': 'Failed to fetch student data'}), 500

# Get parent's student doubts
@app.route('/api/parent/doubts/<parent_id>', methods=['GET'])
def get_parent_student_doubts(parent_id):
    """Get doubts for parent's linked student"""
    try:
        # Find the parent
        parent = users_collection.find_one({'_id': ObjectId(parent_id)})
        if not parent or parent['role'] != 'parent':
            return jsonify({'message': 'Parent not found'}), 404
        
        # Find the linked student
        student = users_collection.find_one({'email': parent['linkedStudentEmail']})
        if not student:
            return jsonify({'message': 'Linked student not found'}), 404
        
        # Get doubts for this student
        doubts = list(doubts_collection.find({'studentEmail': student['email']}))
        
        # Convert ObjectId to string and format data
        for doubt in doubts:
            doubt['_id'] = str(doubt['_id'])
            doubt['timestamp'] = doubt.get('createdAt', datetime.utcnow()).isoformat()
        
        return jsonify(doubts), 200
        
    except Exception as e:
        print(f"❌ Error in get_parent_student_doubts: {str(e)}")
        return jsonify({'message': 'Failed to fetch doubts'}), 500

# Get parent's student progress details
@app.route('/api/parent/student-progress/<parent_id>', methods=['GET'])
def get_parent_student_progress(parent_id):
    """Get detailed progress for parent's linked student"""
    try:
        # Find the parent
        parent = users_collection.find_one({'_id': ObjectId(parent_id)})
        if not parent or parent['role'] != 'parent':
            return jsonify({'message': 'Parent not found'}), 404
        
        # Find the linked student
        student = users_collection.find_one({'email': parent['linkedStudentEmail']})
        if not student:
            return jsonify({'message': 'Linked student not found'}), 404
        
        # Get student progress data (reuse the student_progress function logic)
        user = student
        progress = progress_collection.find_one({'userId': student['_id']})
        
        # Get activities for weekly calculation
        activities = list(activities_collection.find(
            {'userId': student['_id'], 'type': 'study'},
            {'timestamp': 1, 'duration': 1}
        ).sort('timestamp', -1).limit(100))
        
        # Calculate weekly activity
        weekly_activity = calculate_weekly_activity(activities)
        
        # Calculate total weekly time
        weekly_total_minutes = sum(day['hours'] * 60 for day in weekly_activity)
        weekly_total_hours = weekly_total_minutes // 60
        weekly_total_minutes_remainder = weekly_total_minutes % 60
        weekly_total = f"{weekly_total_hours}h {weekly_total_minutes_remainder}m"
        
        # Calculate average daily time
        if activities:
            total_study_minutes = sum(activity.get('duration', 0) for activity in activities)
            avg_daily_minutes = total_study_minutes / max(len(activities), 1)
            avg_daily_hours = int(avg_daily_minutes // 60)
            avg_daily_minutes_remainder = int(avg_daily_minutes % 60)
            avg_daily_time = f"{avg_daily_hours}h {avg_daily_minutes_remainder}m"
        else:
            avg_daily_time = "0h 0m"
        
        # Calculate subject progress from real data
        subjects_progress = []
        chapters_completed = 0
        
        if progress and 'subjects' in progress:
            for subject in progress['subjects']:
                subjects_progress.append({
                    'name': subject['name'],
                    'progress': subject.get('progress', 0),
                    'completedChapters': subject.get('completedChapters', 0),
                    'totalChapters': subject.get('totalChapters', 0),
                    'lastActivity': subject.get('lastActivity', datetime.utcnow().isoformat()),
                    'color': get_subject_color(subject['name'])
                })
                chapters_completed += subject.get('completedChapters', 0)
        
        # Get real achievements
        achievements = get_student_achievements(user, progress, activities)
        
        response_data = {
            'name': user['name'],
            'overallProgress': user.get('totalProgress', 0),
            'points': user.get('points', 0),
            'streak': user.get('currentStreak', 0),
            'weeklyTotal': weekly_total,
            'chaptersCompleted': chapters_completed,
            'avgDailyTime': avg_daily_time,
            'subjects': subjects_progress,
            'weeklyActivity': weekly_activity,
            'achievements': achievements
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"❌ Error in get_parent_student_progress: {str(e)}")
        return jsonify({'message': 'Failed to fetch student progress data'}), 500
    
ml_lock = threading.Lock()

# 1. Initialize exactly like your script
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False, 
    max_num_hands=2,
    min_detection_confidence=0.5, 
    min_tracking_confidence=0.5
)

# NEW: Create a thread lock for MediaPipe
hands_lock = threading.Lock() 

def frame_to_vec_exact(frame):
    # This is a direct copy of your working script's logic
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # NEW: Lock the thread so only one frame processes at a time
    with hands_lock:
        res = hands.process(img)
        
    if not res.multi_hand_landmarks:
        return np.zeros(126, dtype=np.float32)
    
    hands_map = {}
    for i, lm in enumerate(res.multi_hand_landmarks):
        label = res.multi_handedness[i].classification[0].label.lower()
        a = []
        for p in lm.landmark:
            a.extend([p.x, p.y, p.z])
        hands_map[label] = np.array(a, dtype=np.float32)
    
    left = hands_map.get('left', np.zeros(63, dtype=np.float32))
    right = hands_map.get('right', np.zeros(63, dtype=np.float32))
    return np.concatenate([left, right], axis=0)

@app.route('/api/predict-sign', methods=['POST'])
def predict_sign():
    # 1. If the server is already processing a frame, immediately reject the new request
    # This prevents the queue from backing up and Keras from crashing.
    if not ml_lock.acquire(blocking=False):
        print("Server busy, dropping frame tick...")
        return jsonify({"word": None}), 200
        
    try:
        data = request.get_json()
        frames_list = data.get('frames', [])
        
        if not frames_list:
            return jsonify({"word": None}), 200

        vectors = []
        for i, f_b64 in enumerate(frames_list):
            try:
                if ',' in f_b64:
                    f_b64 = f_b64.split(',')[1]
                img_bytes = base64.b64decode(f_b64)
                np_arr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                if frame is None:
                    continue
                
                # Extract features
                vec = frame_to_vec_exact(frame)
                vectors.append(vec)
            except Exception as e:
                continue

        if len(vectors) == 0:
            return jsonify({"word": None}), 200

        # Pad if needed
        if len(vectors) < 30:
            padding = [np.zeros(126)] * (30 - len(vectors))
            vectors = padding + vectors[-30:]
        else:
            vectors = vectors[-30:]

        arr = np.stack(vectors)[None, ...]
        
        # Predict using Keras (now safely isolated)
        probs = sign_model.predict(arr, verbose=0)[0]

        # Get Top 5 Predictions
        top_indices = np.argsort(probs)[-5:][::-1] 
        
        predictions = []
        for idx in top_indices:
            predictions.append({
                "word": sign_labels[int(idx)],
                "confidence": float(probs[int(idx)])
            })

        return jsonify({
            "predictions": predictions,
            "word": predictions[0]["word"], 
            "confidence": predictions[0]["confidence"]
        })

    except Exception as e:
        print("!!! FATAL ERROR IN /api/predict-sign !!!")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
        
    finally:
        # 2. ALWAYS release the lock when done, even if an error occurred!
        ml_lock.release()
    
def predict_from_landmarks(landmarks):
    input_data = np.array(landmarks).reshape(1, 30, 126)
    
    with ml_lock:
        prediction = sign_model.predict(input_data, verbose=0)
        
    index = int(np.argmax(prediction))
    
    return sign_labels[index]

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.json
    landmarks = data.get("landmarks")

    if not landmarks:
        return jsonify({"error": "No landmarks"}), 400

    word = predict_from_landmarks(landmarks)

    return jsonify({"word": word})
       
@app.route("/api/doubt", methods=["POST"])
def handle_doubt():
    data = request.json
    sign_text = data.get("text", "")

    # Step 1: AI understanding + answer
    result = get_answer(sign_text)

    # Parse response
    lines = result.split("\n")
    question = ""
    answer = ""

    for line in lines:
        if "QUESTION:" in line:
            question = line.replace("QUESTION:", "").strip()
        if "ANSWER:" in line:
            answer = line.replace("ANSWER:", "").strip()

    # Step 2: Convert to gloss (YOUR logic)
    gloss = to_gloss(answer)

    return jsonify({
        "question": question,
        "answer": answer,
        "gloss": gloss
    })

def clean_tokens(tokens):
    # remove duplicates, smooth noise
    return " ".join(tokens)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 7860)) # Default to 7860 for Hugging Face
    app.run(host='0.0.0.0', port=port)
    print("\n" + "="*50)
    print("🚀 Flask Server Starting...")
    print("📍 https://antonyjacob817-swaralipi-api.hf.space")
    print("📊 Database:", "Swaralipi")
    print("🗃️ Collections:", db.list_collection_names())
    print("="*50 + "\n")
    
    app.run(debug=True, port=5000)