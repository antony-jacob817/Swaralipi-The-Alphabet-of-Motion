#!/usr/bin/env python3
"""
Script to create the first super admin manually.
Run this once during initial setup.
"""
import os
import bcrypt
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def create_first_admin():
    print("🔐 Creating First Super Admin...")
    
    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGO_URI'))
    db = client.Swaralipi
    users_collection = db.users
    
    # Get the first super admin email from environment
    super_admin_emails = os.getenv('SUPER_ADMIN_EMAILS', '').split(',')
    first_admin_email = super_admin_emails[0].strip() if super_admin_emails else "first.admin@school.com"
    
    # Check if admin already exists
    if users_collection.find_one({'email': first_admin_email}):
        print(f"⚠️  Admin {first_admin_email} already exists")
        return
    
    # Set a strong default password (you should change this after first login)
    admin_password = "ChangeThisPassword123!"  # You should change this immediately after
    
    # Hash password with strong rounds
    hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt(rounds=12))
    
    # Create super admin
    admin_user = {
        'name': 'First Administrator',
        'email': first_admin_email,
        'password': hashed_password.decode('utf-8'),
        'role': 'admin',
        'isSuperAdmin': True,
        'createdAt': datetime.utcnow(),
        'lastPasswordChange': datetime.utcnow(),
        'accountStatus': 'active',
        'permissions': {
            'manageUsers': True,
            'manageContent': True,
            'viewAnalytics': True,
            'manageSettings': True,
            'createAdmins': True
        }
    }
    
    result = users_collection.insert_one(admin_user)
    print(f"✅ First super admin created successfully!")
    print(f"📧 Email: {first_admin_email}")
    print(f"🔑 Password: {admin_password}")
    print("⚠️  IMPORTANT: Change this password immediately after first login!")
    print("💡 Use this account to create other admins through the secure endpoint")

if __name__ == "__main__":
    create_first_admin()