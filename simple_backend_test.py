#!/usr/bin/env python3
"""
Simple Backend API Test - Testing basic functionality without RLS policies
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys

# Configuration
BASE_URL = "https://fitlife-extended.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def test_basic_endpoints():
    """Test basic endpoints that don't require complex RLS"""
    print("🔍 Testing Basic API Endpoints...")
    
    # Health check
    response = requests.get(f"{BASE_URL}/", timeout=30)
    print(f"Health Check: {response.status_code} - {response.json() if response.status_code == 200 else 'Failed'}")
    
    # Supabase config
    response = requests.get(f"{BASE_URL}/auth/check-config", timeout=30)
    print(f"Supabase Config: {response.status_code} - {response.json() if response.status_code == 200 else 'Failed'}")
    
    # Test signup with email confirmation disabled
    signup_data = {
        "email": f"testuser_{int(datetime.now().timestamp())}@example.com",
        "password": "TestPass123!",
        "full_name": "Test User",
        "phone": "1234567890",
        "role": "admin"
    }
    
    print(f"\n🔍 Testing Signup with data: {signup_data}")
    response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data, headers=HEADERS, timeout=30)
    print(f"Signup: {response.status_code}")
    if response.status_code != 200:
        print(f"Signup Error: {response.text}")
        return None
    
    signup_result = response.json()
    token = signup_result.get("access_token")
    print(f"Signup Success: Token received: {bool(token)}")
    
    if not token:
        return None
    
    # Test authenticated endpoints
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Test /auth/me
    response = requests.get(f"{BASE_URL}/auth/me", headers=auth_headers, timeout=30)
    print(f"Auth Me: {response.status_code}")
    if response.status_code != 200:
        print(f"Auth Me Error: {response.text}")
    
    # Test plans list (should work without RLS issues)
    response = requests.get(f"{BASE_URL}/plans", headers=auth_headers, timeout=30)
    print(f"Plans List: {response.status_code}")
    if response.status_code != 200:
        print(f"Plans List Error: {response.text}")
    else:
        plans = response.json()
        print(f"Plans found: {len(plans)}")
    
    return token

def test_with_service_key():
    """Test using service key to bypass RLS"""
    print("\n🔍 Testing with Service Key (bypassing RLS)...")
    
    # This would require modifying the backend to use service key for admin operations
    # For now, let's just test if we can create a plan
    
    plan_data = {
        "name": "Test Plan",
        "description": "Test plan description",
        "duration_months": 1,
        "price": 50.0,
        "features": ["Test Feature"]
    }
    
    response = requests.post(f"{BASE_URL}/plans", json=plan_data, headers=HEADERS, timeout=30)
    print(f"Create Plan (no auth): {response.status_code}")
    if response.status_code != 200:
        print(f"Create Plan Error: {response.text}")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 SIMPLE BACKEND API TESTING")
    print("=" * 60)
    
    token = test_basic_endpoints()
    test_with_service_key()
    
    print("\n" + "=" * 60)
    print("📊 SIMPLE TEST COMPLETE")
    print("=" * 60)