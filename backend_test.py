import requests
import sys
import json
from datetime import datetime

class TradingTerminalAPITester:
    def __init__(self, base_url="https://trading-core-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()  # For cookie persistence

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30, use_session=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if endpoint else f"{self.base_url}/api"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            client = self.session if use_session else requests
            if method == 'GET':
                response = client.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = client.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response preview: {str(response_data)[:200]}...")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            self.failed_tests.append({"test": name, "error": "Timeout"})
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({"test": name, "error": str(e)})
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        if success and isinstance(response, dict):
            message = response.get('message', '')
            if 'LENSTEDREAL' in message and 'Quantum Terminal' in message:
                print("   ✅ Correct branding message found")
                return True
            else:
                print(f"   ⚠️  Unexpected message: {message}")
        return success

    def test_market_data(self):
        """Test market data endpoint"""
        success, response = self.run_test(
            "Market Data (CoinGecko)",
            "GET",
            "market-data",
            200,
            timeout=20
        )
        if success and isinstance(response, list) and len(response) > 0:
            coin = response[0]
            required_fields = ['id', 'symbol', 'name', 'current_price', 'market_cap', 'price_change_percentage_24h']
            missing_fields = [field for field in required_fields if field not in coin]
            if not missing_fields:
                print(f"   ✅ Found {len(response)} coins with all required fields")
                return True
            else:
                print(f"   ⚠️  Missing fields: {missing_fields}")
        return success

    def test_trending(self):
        """Test trending coins endpoint"""
        success, response = self.run_test(
            "Trending Coins",
            "GET",
            "trending",
            200,
            timeout=20
        )
        if success and isinstance(response, dict) and 'coins' in response:
            coins = response['coins']
            if len(coins) > 0:
                print(f"   ✅ Found {len(coins)} trending coins")
                return True
            else:
                print("   ⚠️  No trending coins returned")
        return success

    def test_global_stats(self):
        """Test global market stats endpoint"""
        success, response = self.run_test(
            "Global Market Stats",
            "GET",
            "global-stats",
            200,
            timeout=20
        )
        if success and isinstance(response, dict) and 'data' in response:
            data = response['data']
            if 'total_market_cap' in data and 'market_cap_percentage' in data:
                print("   ✅ Global stats contain market cap and dominance data")
                return True
            else:
                print("   ⚠️  Missing expected global stats fields")
        return success

    def test_auth_login(self):
        """Test admin login with correct credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@lenstedreal.com", "password": "LenstedAdmin2026!"},
            use_session=True
        )
        if success and isinstance(response, dict):
            required_fields = ['id', 'email', 'name', 'role', 'email_verified', 'totp_enabled']
            missing_fields = [field for field in required_fields if field not in response]
            if not missing_fields and response.get('email') == 'admin@lenstedreal.com':
                print("   ✅ Admin login successful with correct user data")
                return True
            else:
                print(f"   ⚠️  Missing fields or incorrect email: {missing_fields}")
        return success

    def test_auth_register(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": "TestPass123!", "name": "Test User"}
        )
        if success and isinstance(response, dict):
            if response.get('email') == test_email and 'verification_code_hint' in response:
                print("   ✅ Registration successful with verification code")
                return True
            else:
                print("   ⚠️  Registration response missing expected fields")
        return success

    def test_auth_me(self):
        """Test getting current user (requires login first)"""
        # First login
        login_success, _ = self.run_test(
            "Login for /me test",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@lenstedreal.com", "password": "LenstedAdmin2026!"},
            use_session=True
        )
        
        if not login_success:
            print("   ❌ Login failed, cannot test /me endpoint")
            return False
            
        # Then test /me
        success, response = self.run_test(
            "Get Current User (/me)",
            "GET",
            "auth/me",
            200,
            use_session=True
        )
        if success and isinstance(response, dict):
            if response.get('email') == 'admin@lenstedreal.com':
                print("   ✅ /me endpoint returns correct user data")
                return True
            else:
                print("   ⚠️  /me endpoint returned unexpected user data")
        return success

    def test_auth_logout(self):
        """Test logout functionality"""
        # First login
        login_success, _ = self.run_test(
            "Login for logout test",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@lenstedreal.com", "password": "LenstedAdmin2026!"},
            use_session=True
        )
        
        if not login_success:
            print("   ❌ Login failed, cannot test logout")
            return False
            
        # Then logout
        success, response = self.run_test(
            "User Logout",
            "POST",
            "auth/logout",
            200,
            use_session=True
        )
        if success and isinstance(response, dict):
            if 'message' in response and 'Logged out' in response['message']:
                print("   ✅ Logout successful")
                return True
            else:
                print("   ⚠️  Logout response unexpected")
        return success

    def test_login_logs(self):
        """Test login activity logs"""
        success, response = self.run_test(
            "Login Activity Logs",
            "GET",
            "login-logs",
            200
        )
        if success and isinstance(response, list):
            if len(response) > 0:
                log = response[0]
                required_fields = ['email', 'ip_address', 'device', 'device_type', 'success', 'timestamp']
                missing_fields = [field for field in required_fields if field not in log]
                if not missing_fields:
                    print(f"   ✅ Found {len(response)} login logs with all required fields")
                    return True
                else:
                    print(f"   ⚠️  Missing fields in login logs: {missing_fields}")
            else:
                print("   ⚠️  No login logs found")
        return success

    def test_2fa_setup(self):
        """Test 2FA setup endpoint"""
        # First login
        login_success, _ = self.run_test(
            "Login for 2FA setup test",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@lenstedreal.com", "password": "LenstedAdmin2026!"},
            use_session=True
        )
        
        if not login_success:
            print("   ❌ Login failed, cannot test 2FA setup")
            return False
            
        # Then test 2FA setup
        success, response = self.run_test(
            "2FA Setup",
            "POST",
            "auth/setup-2fa",
            200,
            use_session=True
        )
        if success and isinstance(response, dict):
            if 'secret' in response and 'qr_code' in response:
                print("   ✅ 2FA setup returns secret and QR code")
                return True
            else:
                print("   ⚠️  2FA setup response missing expected fields")
        return success

def main():
    print("🚀 LENSTEDREAL Quantum Terminal API Testing")
    print("=" * 50)
    
    tester = TradingTerminalAPITester()
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
        tester.test_auth_login,
        tester.test_auth_register,
        tester.test_auth_me,
        tester.test_auth_logout,
        tester.test_login_logs,
        tester.test_2fa_setup,
        tester.test_market_data,
        tester.test_trending,
        tester.test_global_stats,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            tester.failed_tests.append({"test": test.__name__, "error": str(e)})
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            error_msg = failure.get('error', f"Status {failure.get('actual')} != {failure.get('expected')}")
            print(f"   - {failure['test']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())