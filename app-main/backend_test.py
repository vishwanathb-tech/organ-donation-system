import requests
import sys
import json
from datetime import datetime

class OrganDonationAPITester:
    def __init__(self, base_url="https://organ-connect.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.donor_token = None
        self.recipient_token = None
        self.hospital_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            if not success:
                details += f", Expected: {expected_status}"
                if response.text:
                    try:
                        error_data = response.json()
                        details += f", Error: {error_data.get('detail', 'Unknown error')}"
                    except:
                        details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_user_registration(self):
        """Test user registration for all three roles"""
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Test donor registration
        donor_data = {
            "email": f"donor_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Test Donor {timestamp}",
            "role": "donor"
        }
        
        success, response = self.run_test(
            "Donor Registration",
            "POST",
            "auth/register",
            200,
            data=donor_data
        )
        
        if success and 'access_token' in response:
            self.donor_token = response['access_token']
            self.donor_user_id = response['user']['id']
        
        # Test recipient registration
        recipient_data = {
            "email": f"recipient_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Test Recipient {timestamp}",
            "role": "recipient"
        }
        
        success, response = self.run_test(
            "Recipient Registration",
            "POST",
            "auth/register",
            200,
            data=recipient_data
        )
        
        if success and 'access_token' in response:
            self.recipient_token = response['access_token']
            self.recipient_user_id = response['user']['id']
        
        # Test hospital registration
        hospital_data = {
            "email": f"hospital_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Test Hospital {timestamp}",
            "role": "hospital"
        }
        
        success, response = self.run_test(
            "Hospital Registration",
            "POST",
            "auth/register",
            200,
            data=hospital_data
        )
        
        if success and 'access_token' in response:
            self.hospital_token = response['access_token']
            self.hospital_user_id = response['user']['id']
        
        return self.donor_token and self.recipient_token and self.hospital_token

    def test_user_login(self):
        """Test login functionality"""
        # Test with invalid credentials
        invalid_login = {
            "email": "invalid@test.com",
            "password": "wrongpassword"
        }
        
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data=invalid_login
        )
        
        return True

    def test_auth_me(self):
        """Test getting current user info"""
        if not self.donor_token:
            self.log_test("Auth Me - Donor", False, "No donor token available")
            return False
            
        success, response = self.run_test(
            "Auth Me - Donor",
            "GET",
            "auth/me",
            200,
            token=self.donor_token
        )
        
        return success

    def test_donor_profile_creation(self):
        """Test donor profile creation and management"""
        if not self.donor_token:
            self.log_test("Donor Profile Creation", False, "No donor token available")
            return False
        
        donor_profile_data = {
            "blood_type": "O+",
            "age": 30,
            "organs_available": ["kidney", "liver"],
            "medical_history": "No significant medical history"
        }
        
        success, response = self.run_test(
            "Create Donor Profile",
            "POST",
            "donors",
            200,
            data=donor_profile_data,
            token=self.donor_token
        )
        
        if success:
            self.donor_profile_id = response.get('id')
        
        # Test getting donor profile
        self.run_test(
            "Get Donor Profile",
            "GET",
            "donors/me",
            200,
            token=self.donor_token
        )
        
        # Test updating donor profile
        updated_data = {
            "blood_type": "O+",
            "age": 31,
            "organs_available": ["kidney", "liver", "heart"],
            "medical_history": "Updated medical history"
        }
        
        self.run_test(
            "Update Donor Profile",
            "PUT",
            "donors/me",
            200,
            data=updated_data,
            token=self.donor_token
        )
        
        return success

    def test_recipient_profile_creation(self):
        """Test recipient profile creation and management"""
        if not self.recipient_token:
            self.log_test("Recipient Profile Creation", False, "No recipient token available")
            return False
        
        recipient_profile_data = {
            "blood_type": "O+",
            "age": 35,
            "organs_needed": ["kidney"],
            "urgency_level": "high",
            "medical_history": "Kidney disease"
        }
        
        success, response = self.run_test(
            "Create Recipient Profile",
            "POST",
            "recipients",
            200,
            data=recipient_profile_data,
            token=self.recipient_token
        )
        
        if success:
            self.recipient_profile_id = response.get('id')
        
        # Test getting recipient profile
        self.run_test(
            "Get Recipient Profile",
            "GET",
            "recipients/me",
            200,
            token=self.recipient_token
        )
        
        # Test updating recipient profile
        updated_data = {
            "blood_type": "O+",
            "age": 35,
            "organs_needed": ["kidney", "liver"],
            "urgency_level": "critical",
            "medical_history": "Updated kidney disease status"
        }
        
        self.run_test(
            "Update Recipient Profile",
            "PUT",
            "recipients/me",
            200,
            data=updated_data,
            token=self.recipient_token
        )
        
        return success

    def test_hospital_profile_creation(self):
        """Test hospital profile creation"""
        if not self.hospital_token:
            self.log_test("Hospital Profile Creation", False, "No hospital token available")
            return False
        
        hospital_profile_data = {
            "hospital_name": "Test General Hospital",
            "location": "Test City, TS",
            "contact_number": "+1 (555) 123-4567"
        }
        
        success, response = self.run_test(
            "Create Hospital Profile",
            "POST",
            "hospitals",
            200,
            data=hospital_profile_data,
            token=self.hospital_token
        )
        
        if success:
            self.hospital_profile_id = response.get('id')
        
        # Test getting hospital profile
        self.run_test(
            "Get Hospital Profile",
            "GET",
            "hospitals/me",
            200,
            token=self.hospital_token
        )
        
        return success

    def test_blood_compatibility_matching(self):
        """Test blood type compatibility and matching"""
        if not (self.donor_token and self.recipient_token):
            self.log_test("Blood Compatibility Test", False, "Missing tokens")
            return False
        
        # Test potential matches for donor
        self.run_test(
            "Donor Potential Matches",
            "GET",
            "matches/potential",
            200,
            token=self.donor_token
        )
        
        # Test potential matches for recipient
        self.run_test(
            "Recipient Potential Matches",
            "GET",
            "matches/potential",
            200,
            token=self.recipient_token
        )
        
        return True

    def test_hospital_access_to_data(self):
        """Test hospital access to donor and recipient data"""
        if not self.hospital_token:
            self.log_test("Hospital Data Access", False, "No hospital token available")
            return False
        
        # Test getting all donors
        self.run_test(
            "Hospital Get All Donors",
            "GET",
            "donors",
            200,
            token=self.hospital_token
        )
        
        # Test getting all recipients
        self.run_test(
            "Hospital Get All Recipients",
            "GET",
            "recipients",
            200,
            token=self.hospital_token
        )
        
        return True

    def test_match_creation(self):
        """Test hospital creating matches between compatible pairs"""
        if not (self.hospital_token and hasattr(self, 'donor_profile_id') and hasattr(self, 'recipient_profile_id')):
            self.log_test("Match Creation", False, "Missing required data")
            return False
        
        match_data = {
            "donor_id": self.donor_profile_id,
            "recipient_id": self.recipient_profile_id,
            "organ_type": "kidney"
        }
        
        success, response = self.run_test(
            "Create Match",
            "POST",
            "matches",
            200,
            data=match_data,
            token=self.hospital_token
        )
        
        if success:
            self.match_id = response.get('id')
        
        return success

    def test_match_retrieval(self):
        """Test retrieving matches for different user types"""
        # Test donor getting their matches
        if self.donor_token:
            self.run_test(
                "Donor Get Matches",
                "GET",
                "matches",
                200,
                token=self.donor_token
            )
        
        # Test recipient getting their matches
        if self.recipient_token:
            self.run_test(
                "Recipient Get Matches",
                "GET",
                "matches",
                200,
                token=self.recipient_token
            )
        
        return True

    def test_access_control(self):
        """Test access control and permissions"""
        # Test donor trying to access hospital endpoints
        if self.donor_token:
            self.run_test(
                "Donor Access Control - Hospital Profile",
                "POST",
                "hospitals",
                403,
                data={"hospital_name": "Test", "location": "Test", "contact_number": "123"},
                token=self.donor_token
            )
        
        # Test recipient trying to create donor profile
        if self.recipient_token:
            self.run_test(
                "Recipient Access Control - Donor Profile",
                "POST",
                "donors",
                403,
                data={"blood_type": "A+", "age": 25, "organs_available": ["kidney"]},
                token=self.recipient_token
            )
        
        return True

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🧪 Starting Organ Donation Platform API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_root_endpoint():
            print("❌ Root endpoint failed, stopping tests")
            return False
        
        # Authentication tests
        if not self.test_user_registration():
            print("❌ User registration failed, stopping tests")
            return False
        
        self.test_user_login()
        self.test_auth_me()
        
        # Profile creation tests
        self.test_donor_profile_creation()
        self.test_recipient_profile_creation()
        self.test_hospital_profile_creation()
        
        # Matching and compatibility tests
        self.test_blood_compatibility_matching()
        self.test_hospital_access_to_data()
        self.test_match_creation()
        self.test_match_retrieval()
        
        # Security tests
        self.test_access_control()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run}")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = OrganDonationAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            'test_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())