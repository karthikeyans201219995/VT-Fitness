"""
Test the QR attendance system
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_qr_system():
    """Test QR code generation and scanning"""
    
    print("=" * 60)
    print("Testing QR Attendance System")
    print("=" * 60)
    
    # Step 1: Get a member
    print("\n1. Fetching members...")
    try:
        response = requests.get(f"{BASE_URL}/members")
        if response.status_code == 200:
            members = response.json()
            if not members:
                print("❌ No members found. Please add members first.")
                return
            
            member = members[0]
            member_id = member['id']
            member_name = member['full_name']
            print(f"✓ Found member: {member_name} (ID: {member_id})")
        else:
            print(f"❌ Failed to fetch members: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error fetching members: {str(e)}")
        return
    
    # Step 2: Generate QR code
    print(f"\n2. Generating QR code for {member_name}...")
    try:
        response = requests.post(f"{BASE_URL}/qr-attendance/generate/{member_id}")
        if response.status_code == 200:
            qr_data = response.json()
            qr_code = qr_data['qr_code']
            print(f"✓ QR Code generated: {qr_code}")
        else:
            print(f"❌ Failed to generate QR code: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error generating QR code: {str(e)}")
        return
    
    # Step 3: Test check-in
    print(f"\n3. Testing check-in...")
    try:
        response = requests.post(
            f"{BASE_URL}/qr-attendance/scan",
            json={"qr_code": qr_code, "notes": "Test check-in"}
        )
        if response.status_code == 200:
            scan_result = response.json()
            print(f"✓ Check-in successful!")
            print(f"  Action: {scan_result['action']}")
            print(f"  Message: {scan_result['message']}")
            print(f"  Timestamp: {scan_result['timestamp']}")
            attendance_id = scan_result['attendance_id']
        else:
            print(f"❌ Check-in failed: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error during check-in: {str(e)}")
        return
    
    # Step 4: Check status
    print(f"\n4. Checking attendance status...")
    try:
        response = requests.get(f"{BASE_URL}/qr-attendance/status/{member_id}")
        if response.status_code == 200:
            status = response.json()
            print(f"✓ Status retrieved:")
            print(f"  Is checked in: {status['is_checked_in']}")
            print(f"  Check-in time: {status['check_in_time']}")
        else:
            print(f"❌ Failed to get status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error checking status: {str(e)}")
    
    # Step 5: Test check-out
    print(f"\n5. Testing check-out...")
    try:
        response = requests.post(
            f"{BASE_URL}/qr-attendance/scan",
            json={"qr_code": qr_code, "notes": "Test check-out"}
        )
        if response.status_code == 200:
            scan_result = response.json()
            print(f"✓ Check-out successful!")
            print(f"  Action: {scan_result['action']}")
            print(f"  Message: {scan_result['message']}")
            print(f"  Timestamp: {scan_result['timestamp']}")
        else:
            print(f"❌ Check-out failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error during check-out: {str(e)}")
    
    print("\n" + "=" * 60)
    print("✓ QR Attendance System Test Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Run the SQL migration in Supabase SQL Editor")
    print("2. Generate QR codes: python generate_member_qr_codes.py")
    print("3. Print QR codes for members")
    print("4. Use the frontend to scan QR codes")
    print("=" * 60)


if __name__ == "__main__":
    test_qr_system()
