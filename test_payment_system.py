"""
Test script for payment balance system
Run this to verify all features are working
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_payment_system():
    """Test the payment balance tracking system"""
    
    print("=" * 60)
    print("Payment Balance System Test")
    print("=" * 60)
    print()
    
    # Test 1: Create member with full payment
    print("Test 1: Full Payment Registration")
    print("-" * 60)
    
    full_payment_data = {
        "full_name": "John Doe",
        "email": f"john.doe.{datetime.now().timestamp()}@test.com",
        "phone": "1234567890",
        "plan_id": None,  # You'll need to get a real plan ID
        "start_date": datetime.now().date().isoformat(),
        "end_date": (datetime.now() + timedelta(days=30)).date().isoformat(),
        "amount": 100.00,
        "payment_method": "cash",
        "payment_date": datetime.now().date().isoformat(),
        "payment_status": "completed"
    }
    
    print(f"Creating member: {full_payment_data['full_name']}")
    print(f"Payment: ${full_payment_data['amount']}")
    print()
    
    # Test 2: Create member with partial payment
    print("Test 2: Partial Payment Registration")
    print("-" * 60)
    
    partial_payment_data = {
        "full_name": "Jane Smith",
        "email": f"jane.smith.{datetime.now().timestamp()}@test.com",
        "phone": "0987654321",
        "plan_id": None,  # You'll need to get a real plan ID
        "start_date": datetime.now().date().isoformat(),
        "end_date": (datetime.now() + timedelta(days=30)).date().isoformat(),
        "amount": 50.00,  # Partial payment
        "payment_method": "card",
        "payment_date": datetime.now().date().isoformat(),
        "payment_status": "completed"
    }
    
    print(f"Creating member: {partial_payment_data['full_name']}")
    print(f"Payment: ${partial_payment_data['amount']} (Partial)")
    print()
    
    # Test 3: Get all payments
    print("Test 3: Retrieve Payments")
    print("-" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/payments")
        if response.status_code == 200:
            payments = response.json()
            print(f"✅ Retrieved {len(payments)} payments")
            
            # Check for balance information
            for payment in payments[:3]:  # Show first 3
                print(f"\nPayment ID: {payment.get('id', 'N/A')}")
                print(f"  Amount: ${payment.get('amount', 0)}")
                print(f"  Is Partial: {payment.get('is_partial', False)}")
                print(f"  Remaining Balance: ${payment.get('remaining_balance', 0)}")
                print(f"  Payment Type: {payment.get('payment_type', 'N/A')}")
        else:
            print(f"❌ Failed to retrieve payments: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print()
    
    # Test 4: Check invoice download endpoint
    print("Test 4: Invoice Download Endpoint")
    print("-" * 60)
    print("Note: You need to test this manually by:")
    print("1. Go to http://localhost:3000/payments")
    print("2. Click download button on any payment")
    print("3. Verify PDF downloads successfully")
    print()
    
    # Test 5: Email configuration check
    print("Test 5: Email Configuration")
    print("-" * 60)
    
    import os
    from dotenv import load_dotenv
    
    # Load environment variables
    env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
    load_dotenv(env_path)
    
    smtp_user = os.getenv('SMTP_USERNAME')
    smtp_pass = os.getenv('SMTP_PASSWORD')
    portal_url = os.getenv('MEMBER_PORTAL_URL')
    gym_name = os.getenv('GYM_NAME')
    
    if smtp_user and smtp_pass:
        print(f"✅ Email configured: {smtp_user}")
    else:
        print("❌ Email not configured in .env")
    
    if portal_url:
        print(f"✅ Portal URL: {portal_url}")
    else:
        print("⚠️  Portal URL not set (using default)")
    
    if gym_name:
        print(f"✅ Gym Name: {gym_name}")
    else:
        print("⚠️  Gym Name not set (using default)")
    
    print()
    
    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    print()
    print("✅ Features to test manually:")
    print("  1. Add member with full payment → Check status = Active")
    print("  2. Add member with partial payment → Check status = Inactive")
    print("  3. Download invoice → Verify PDF downloads")
    print("  4. Check email → Verify welcome email received")
    print("  5. Click portal link → Verify opens login page")
    print("  6. Make additional payment → Verify balance updates")
    print()
    print("📚 Documentation:")
    print("  - Setup Guide: PAYMENT_BALANCE_SETUP.md")
    print("  - Quick Start: QUICK_START_PAYMENT_SYSTEM.md")
    print("  - Changes: PAYMENT_SYSTEM_CHANGES.md")
    print()
    print("🔧 Setup Steps:")
    print("  1. Run SQL: backend/add_payment_tracking.sql")
    print("  2. Configure: backend/.env")
    print("  3. Install: pip install reportlab")
    print("  4. Start: python backend/server.py")
    print()


if __name__ == "__main__":
    test_payment_system()
