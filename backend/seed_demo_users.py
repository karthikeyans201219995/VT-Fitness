"""
Script to create demo users in the database using Supabase Auth
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def seed_demo_users():
    supabase_url = os.environ.get('SUPABASE_URL')
    # Use service key for admin operations
    supabase_key = os.environ.get('SUPABASE_SERVICE_KEY') or os.environ.get('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("Error: Supabase credentials not found in .env file")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    
    demo_users = [
        {
            "email": "admin@gymfit.com",
            "password": "admin123",
            "full_name": "Admin User",
            "phone": "+1234567890",
            "role": "admin"
        },
        {
            "email": "trainer@gymfit.com",
            "password": "trainer123",
            "full_name": "Trainer User",
            "phone": "+1234567891",
            "role": "trainer"
        },
        {
            "email": "member@gymfit.com",
            "password": "member123",
            "full_name": "Member User",
            "phone": "+1234567892",
            "role": "member"
        }
    ]
    
    for user_data in demo_users:
        try:
            # Create user in Supabase Auth
            auth_response = supabase.auth.admin.create_user({
                "email": user_data["email"],
                "password": user_data["password"],
                "email_confirm": True
            })
            
            if auth_response.user:
                # Add user details to users table
                supabase.table('users').insert({
                    "id": auth_response.user.id,
                    "email": user_data["email"],
                    "full_name": user_data["full_name"],
                    "phone": user_data["phone"],
                    "role": user_data["role"]
                }).execute()
                
                print(f"✓ Created user: {user_data['email']} (role: {user_data['role']})")
            else:
                print(f"✗ Failed to create auth user: {user_data['email']}")
                
        except Exception as e:
            print(f"✗ Error creating {user_data['email']}: {str(e)}")
    
    print("\nDemo users created successfully!")
    print("\nYou can now login with:")
    print("Admin: admin@gymfit.com / admin123")
    print("Trainer: trainer@gymfit.com / trainer123")
    print("Member: member@gymfit.com / member123")

if __name__ == "__main__":
    seed_demo_users()
