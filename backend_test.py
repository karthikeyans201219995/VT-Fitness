#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Fitness Hub Application
Tests all endpoints with Supabase integration
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys
import os

# Configuration
BASE_URL = "https://fitlife-extended.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test data
TEST_ADMIN = {
    "email": "admin@fitnesshub.com",
    "password": "Admin@123",
    "full_name": "Test Admin",
    "phone": "1234567890",
    "role": "admin"
}

TEST_PLAN = {
    "name": "Monthly Basic",
    "description": "Basic gym access",
    "duration_months": 1,
    "price": 50.0,
    "features": ["Gym Access", "Locker"]
}

# Global variables to store test data
auth_token = None
created_plan_id = None
created_member_id = None
created_attendance_id = None
created_payment_id = None

def print_test_result(test_name, success, message="", response_data=None):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if message:
        print(f"   {message}")
    if response_data and not success:
        print(f"   Response: {response_data}")
    print()

def make_request(method, endpoint, data=None, headers=None, auth_required=True):
    """Make HTTP request with proper headers and auth"""
    url = f"{BASE_URL}{endpoint}"
    request_headers = HEADERS.copy()
    
    if headers:
        request_headers.update(headers)
    
    if auth_required and auth_token:
        request_headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=request_headers, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=request_headers, timeout=30)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=request_headers, timeout=30)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=request_headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {str(e)}")
        return None

def test_health_check():
    """Test basic API health"""
    print("🔍 Testing API Health Check...")
    
    response = make_request("GET", "/", auth_required=False)
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("API Health Check", True, f"API Status: {data.get('status', 'unknown')}")
        return True
    else:
        print_test_result("API Health Check", False, f"Status: {response.status_code if response else 'No response'}")
        return False

def test_supabase_config():
    """Test Supabase configuration"""
    print("🔍 Testing Supabase Configuration...")
    
    response = make_request("GET", "/auth/check-config", auth_required=False)
    if response and response.status_code == 200:
        data = response.json()
        configured = data.get("configured", False)
        print_test_result("Supabase Configuration", configured, data.get("message", ""))
        return configured
    else:
        print_test_result("Supabase Configuration", False, f"Status: {response.status_code if response else 'No response'}")
        return False

def test_auth_signup():
    """Test user signup"""
    print("🔍 Testing Authentication - Signup...")
    
    response = make_request("POST", "/auth/signup", TEST_ADMIN, auth_required=False)
    if response and response.status_code == 200:
        data = response.json()
        global auth_token
        auth_token = data.get("access_token")
        user = data.get("user", {})
        print_test_result("User Signup", True, f"User created: {user.get('email')} (Role: {user.get('role')})")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("User Signup", False, f"Error: {error_msg}")
        return False

def test_auth_login():
    """Test user login"""
    print("🔍 Testing Authentication - Login...")
    
    login_data = {
        "email": TEST_ADMIN["email"],
        "password": TEST_ADMIN["password"]
    }
    
    response = make_request("POST", "/auth/login", login_data, auth_required=False)
    if response and response.status_code == 200:
        data = response.json()
        global auth_token
        auth_token = data.get("access_token")
        user = data.get("user", {})
        print_test_result("User Login", True, f"Login successful: {user.get('email')}")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("User Login", False, f"Error: {error_msg}")
        return False

def test_auth_me():
    """Test get current user"""
    print("🔍 Testing Authentication - Get Current User...")
    
    response = make_request("GET", "/auth/me")
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("Get Current User", True, f"User: {data.get('full_name')} ({data.get('email')})")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Get Current User", False, f"Error: {error_msg}")
        return False

def test_plans_create():
    """Test creating a plan"""
    print("🔍 Testing Plans - Create Plan...")
    
    response = make_request("POST", "/plans", TEST_PLAN)
    if response and response.status_code == 200:
        data = response.json()
        global created_plan_id
        created_plan_id = data.get("id")
        print_test_result("Create Plan", True, f"Plan created: {data.get('name')} (ID: {created_plan_id})")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Create Plan", False, f"Error: {error_msg}")
        return False

def test_plans_list():
    """Test listing plans"""
    print("🔍 Testing Plans - List Plans...")
    
    response = make_request("GET", "/plans")
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("List Plans", True, f"Found {len(data)} plans")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("List Plans", False, f"Error: {error_msg}")
        return False

def test_plans_get():
    """Test getting a specific plan"""
    if not created_plan_id:
        print_test_result("Get Plan", False, "No plan ID available")
        return False
    
    print("🔍 Testing Plans - Get Specific Plan...")
    
    response = make_request("GET", f"/plans/{created_plan_id}")
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("Get Plan", True, f"Plan: {data.get('name')} - ${data.get('price')}")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Get Plan", False, f"Error: {error_msg}")
        return False

def test_plans_update():
    """Test updating a plan"""
    if not created_plan_id:
        print_test_result("Update Plan", False, "No plan ID available")
        return False
    
    print("🔍 Testing Plans - Update Plan...")
    
    update_data = {
        "price": 60.0,
        "description": "Updated basic gym access with extended hours"
    }
    
    response = make_request("PUT", f"/plans/{created_plan_id}", update_data)
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("Update Plan", True, f"Plan updated: ${data.get('price')} - {data.get('description')}")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Update Plan", False, f"Error: {error_msg}")
        return False

def test_members_create():
    """Test creating a member"""
    if not created_plan_id:
        print_test_result("Create Member", False, "No plan ID available")
        return False
    
    print("🔍 Testing Members - Create Member...")
    
    member_data = {
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "9876543210",
        "date_of_birth": "1990-01-15",
        "gender": "male",
        "address": "123 Main St, City",
        "emergency_contact": "Jane Doe",
        "emergency_phone": "9876543211",
        "blood_group": "O+",
        "plan_id": created_plan_id,
        "start_date": date.today().isoformat(),
        "end_date": (date.today() + timedelta(days=30)).isoformat(),
        "status": "active"
    }
    
    response = make_request("POST", "/members", member_data)
    if response and response.status_code == 200:
        data = response.json()
        global created_member_id
        created_member_id = data.get("id")
        print_test_result("Create Member", True, f"Member created: {data.get('full_name')} (ID: {created_member_id})")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Create Member", False, f"Error: {error_msg}")
        return False

def test_members_list():
    """Test listing members"""
    print("🔍 Testing Members - List Members...")
    
    response = make_request("GET", "/members")
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("List Members", True, f"Found {len(data)} members")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("List Members", False, f"Error: {error_msg}")
        return False

def test_members_get():
    """Test getting a specific member"""
    if not created_member_id:
        print_test_result("Get Member", False, "No member ID available")
        return False
    
    print("🔍 Testing Members - Get Specific Member...")
    
    response = make_request("GET", f"/members/{created_member_id}")
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("Get Member", True, f"Member: {data.get('full_name')} - {data.get('status')}")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Get Member", False, f"Error: {error_msg}")
        return False

def test_members_update():
    """Test updating a member"""
    if not created_member_id:
        print_test_result("Update Member", False, "No member ID available")
        return False
    
    print("🔍 Testing Members - Update Member...")
    
    update_data = {
        "phone": "9876543299",
        "address": "456 Updated St, New City"
    }
    
    response = make_request("PUT", f"/members/{created_member_id}", update_data)
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("Update Member", True, f"Member updated: {data.get('phone')} - {data.get('address')}")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Update Member", False, f"Error: {error_msg}")
        return False

def test_attendance_create():
    """Test creating attendance record"""
    if not created_member_id:
        print_test_result("Create Attendance", False, "No member ID available")
        return False
    
    print("🔍 Testing Attendance - Create Check-in...")
    
    attendance_data = {
        "member_id": created_member_id,
        "notes": "Regular workout session"
    }
    
    response = make_request("POST", "/attendance", attendance_data)
    if response and response.status_code == 200:
        data = response.json()
        global created_attendance_id
        created_attendance_id = data.get("id")
        print_test_result("Create Attendance", True, f"Check-in created for {data.get('member_name')} (ID: {created_attendance_id})")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Create Attendance", False, f"Error: {error_msg}")
        return False

def test_attendance_list():
    """Test listing attendance records"""
    print("🔍 Testing Attendance - List Records...")
    
    response = make_request("GET", "/attendance")
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("List Attendance", True, f"Found {len(data)} attendance records")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("List Attendance", False, f"Error: {error_msg}")
        return False

def test_attendance_update():
    """Test updating attendance record (check-out)"""
    if not created_attendance_id:
        print_test_result("Update Attendance", False, "No attendance ID available")
        return False
    
    print("🔍 Testing Attendance - Update (Check-out)...")
    
    update_data = {
        "check_out_time": datetime.utcnow().isoformat(),
        "notes": "Completed workout session"
    }
    
    response = make_request("PUT", f"/attendance/{created_attendance_id}", update_data)
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("Update Attendance", True, f"Check-out recorded for {data.get('member_name')}")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Update Attendance", False, f"Error: {error_msg}")
        return False

def test_payments_create():
    """Test creating a payment"""
    if not created_member_id or not created_plan_id:
        print_test_result("Create Payment", False, "Missing member or plan ID")
        return False
    
    print("🔍 Testing Payments - Create Payment...")
    
    payment_data = {
        "member_id": created_member_id,
        "amount": 60.0,
        "payment_method": "card",
        "payment_date": date.today().isoformat(),
        "plan_id": created_plan_id,
        "description": "Monthly membership fee",
        "status": "completed"
    }
    
    response = make_request("POST", "/payments", payment_data)
    if response and response.status_code == 200:
        data = response.json()
        global created_payment_id
        created_payment_id = data.get("id")
        print_test_result("Create Payment", True, f"Payment created: ${data.get('amount')} for {data.get('member_name')} (ID: {created_payment_id})")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Create Payment", False, f"Error: {error_msg}")
        return False

def test_payments_list():
    """Test listing payments"""
    print("🔍 Testing Payments - List Payments...")
    
    response = make_request("GET", "/payments")
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("List Payments", True, f"Found {len(data)} payments")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("List Payments", False, f"Error: {error_msg}")
        return False

def test_reports_dashboard():
    """Test dashboard statistics"""
    print("🔍 Testing Reports - Dashboard Stats...")
    
    response = make_request("GET", "/reports/dashboard")
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("Dashboard Stats", True, 
                         f"Members: {data.get('total_members')}, "
                         f"Active: {data.get('active_members')}, "
                         f"Today's Attendance: {data.get('today_attendance')}, "
                         f"Monthly Revenue: ${data.get('monthly_revenue')}")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Dashboard Stats", False, f"Error: {error_msg}")
        return False

def test_reports_members():
    """Test members report"""
    print("🔍 Testing Reports - Members Report...")
    
    response = make_request("GET", "/reports/members")
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("Members Report", True, 
                         f"Total: {data.get('total_members')}, "
                         f"By Status: {data.get('by_status')}, "
                         f"Expiring Soon: {data.get('expiring_soon')}")
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("Members Report", False, f"Error: {error_msg}")
        return False

def test_auth_logout():
    """Test user logout"""
    print("🔍 Testing Authentication - Logout...")
    
    response = make_request("POST", "/auth/logout")
    if response and response.status_code == 200:
        data = response.json()
        print_test_result("User Logout", True, data.get("message", "Logged out"))
        return True
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print_test_result("User Logout", False, f"Error: {error_msg}")
        return False

def run_all_tests():
    """Run all backend tests in sequence"""
    print("=" * 80)
    print("🚀 STARTING COMPREHENSIVE BACKEND API TESTING")
    print("=" * 80)
    print()
    
    test_results = []
    
    # Basic connectivity tests
    test_results.append(("Health Check", test_health_check()))
    test_results.append(("Supabase Config", test_supabase_config()))
    
    # Authentication flow
    test_results.append(("Auth Signup", test_auth_signup()))
    test_results.append(("Auth Login", test_auth_login()))
    test_results.append(("Auth Me", test_auth_me()))
    
    # Plans CRUD
    test_results.append(("Plans Create", test_plans_create()))
    test_results.append(("Plans List", test_plans_list()))
    test_results.append(("Plans Get", test_plans_get()))
    test_results.append(("Plans Update", test_plans_update()))
    
    # Members CRUD
    test_results.append(("Members Create", test_members_create()))
    test_results.append(("Members List", test_members_list()))
    test_results.append(("Members Get", test_members_get()))
    test_results.append(("Members Update", test_members_update()))
    
    # Attendance
    test_results.append(("Attendance Create", test_attendance_create()))
    test_results.append(("Attendance List", test_attendance_list()))
    test_results.append(("Attendance Update", test_attendance_update()))
    
    # Payments
    test_results.append(("Payments Create", test_payments_create()))
    test_results.append(("Payments List", test_payments_list()))
    
    # Reports
    test_results.append(("Reports Dashboard", test_reports_dashboard()))
    test_results.append(("Reports Members", test_reports_members()))
    
    # Logout
    test_results.append(("Auth Logout", test_auth_logout()))
    
    # Summary
    print("=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    print()
    
    # Failed tests
    failed_tests = [name for name, result in test_results if not result]
    if failed_tests:
        print("❌ FAILED TESTS:")
        for test in failed_tests:
            print(f"   - {test}")
        print()
    
    # Test data summary
    print("📋 CREATED TEST DATA:")
    print(f"   - Auth Token: {'✅ Available' if auth_token else '❌ Not available'}")
    print(f"   - Plan ID: {created_plan_id or 'Not created'}")
    print(f"   - Member ID: {created_member_id or 'Not created'}")
    print(f"   - Attendance ID: {created_attendance_id or 'Not created'}")
    print(f"   - Payment ID: {created_payment_id or 'Not created'}")
    print()
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)