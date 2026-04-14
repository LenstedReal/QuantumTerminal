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

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if endpoint else f"{self.base_url}/api"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

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

    def test_system_logs(self):
        """Test system logs endpoints"""
        # Test GET logs
        success_get, logs = self.run_test(
            "Get System Logs",
            "GET",
            "system-logs",
            200
        )
        
        # Test POST log
        success_post, new_log = self.run_test(
            "Add System Log",
            "POST",
            "system-logs?message=Test log entry",
            200
        )
        
        return success_get and success_post

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test POST status
        success_post, status = self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": "test_client"}
        )
        
        # Test GET status
        success_get, statuses = self.run_test(
            "Get Status Checks",
            "GET",
            "status",
            200
        )
        
        return success_post and success_get

def main():
    print("🚀 LENSTEDREAL Quantum Terminal API Testing")
    print("=" * 50)
    
    tester = TradingTerminalAPITester()
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
        tester.test_market_data,
        tester.test_trending,
        tester.test_global_stats,
        tester.test_system_logs,
        tester.test_status_endpoints,
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