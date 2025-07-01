import requests
import json
import sys
from datetime import datetime

class HRMSAPITester:
    def __init__(self, base_url="http://localhost:3000/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        
        if not headers:
            headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            result = {
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success
            }
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result["response"] = response.json()
                except:
                    result["response"] = "No JSON response"
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    result["error"] = response.json()
                except:
                    result["error"] = response.text

            self.test_results.append(result)
            return success, response
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "success": False,
                "error": str(e)
            })
            return False, None

    def test_approval_flow_endpoints(self):
        """Test HRMS approval flow endpoints"""
        print("\n=== Testing HRMS Approval Flow Endpoints ===")
        
        # Test GET approval flows
        self.run_test(
            "Get Approval Flows",
            "GET",
            "hrms/approval-flows",
            200
        )
        
        # Test POST create approval flow
        flow_data = {
            "flowName": f"Test Flow {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "flowDescription": "Test flow created by API test",
            "formType": "manpower_requisition",
            "isActive": True,
            "isDefault": False,
            "steps": [
                {
                    "stepOrder": 1,
                    "stepName": "Department Head Approval",
                    "approverType": "department_head",
                    "isRequired": True
                },
                {
                    "stepOrder": 2,
                    "stepName": "HR Manager Approval",
                    "approverType": "role_based",
                    "isRequired": True
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Approval Flow",
            "POST",
            "hrms/approval-flows",
            201,
            data=flow_data
        )
        
        # If flow creation succeeded, test other endpoints with the created flow
        if success and response and response.status_code == 201:
            try:
                flow_id = response.json()["data"]["_id"]
                
                # Test GET flow by ID
                self.run_test(
                    "Get Approval Flow by ID",
                    "GET",
                    f"hrms/approval-flows/{flow_id}",
                    200
                )
                
                # Test PUT update flow
                update_data = {
                    "flowDescription": "Updated test flow description"
                }
                self.run_test(
                    "Update Approval Flow",
                    "PUT",
                    f"hrms/approval-flows/{flow_id}",
                    200,
                    data=update_data
                )
                
                # Test flow design save endpoint
                design_data = {
                    "flowDesign": {
                        "nodes": [
                            {
                                "id": "start",
                                "type": "start",
                                "position": {"x": 250, "y": 25},
                                "data": {"label": "Start"}
                            },
                            {
                                "id": "step-1",
                                "type": "approval",
                                "position": {"x": 250, "y": 150},
                                "data": {
                                    "label": "Department Head Approval",
                                    "stepOrder": 1,
                                    "approverType": "department_head",
                                    "isRequired": True
                                }
                            },
                            {
                                "id": "step-2",
                                "type": "approval",
                                "position": {"x": 250, "y": 275},
                                "data": {
                                    "label": "HR Manager Approval",
                                    "stepOrder": 2,
                                    "approverType": "role_based",
                                    "isRequired": True
                                }
                            },
                            {
                                "id": "end",
                                "type": "end",
                                "position": {"x": 250, "y": 400},
                                "data": {"label": "End"}
                            }
                        ],
                        "edges": [
                            {
                                "id": "edge-start-step1",
                                "source": "start",
                                "target": "step-1"
                            },
                            {
                                "id": "edge-step1-step2",
                                "source": "step-1",
                                "target": "step-2"
                            },
                            {
                                "id": "edge-step2-end",
                                "source": "step-2",
                                "target": "end"
                            }
                        ]
                    }
                }
                
                self.run_test(
                    "Save Flow Design",
                    "POST",
                    f"hrms/approval-flows/{flow_id}/design",
                    200,
                    data=design_data
                )
                
                # Test flow test endpoint
                test_data = {
                    "sampleFormData": {
                        "department": "sample-department-id",
                        "submittedBy": "sample-user-id"
                    }
                }
                
                self.run_test(
                    "Test Approval Flow",
                    "POST",
                    f"hrms/approval-flows/{flow_id}/test",
                    200,
                    data=test_data
                )
                
                # Test DELETE flow
                self.run_test(
                    "Delete Approval Flow",
                    "DELETE",
                    f"hrms/approval-flows/{flow_id}",
                    200
                )
            except Exception as e:
                print(f"Error in flow tests: {str(e)}")
        
    def test_pdf_generation_endpoint(self):
        """Test PDF generation endpoint"""
        print("\n=== Testing PDF Generation Endpoint ===")
        
        # First, get a list of forms to find one to generate PDF for
        success, response = self.run_test(
            "Get Forms List",
            "GET",
            "hrms/forms/manpower_requisition",
            200
        )
        
        if success and response and response.status_code == 200:
            try:
                forms_data = response.json()
                if forms_data.get("data") and forms_data["data"].get("forms") and len(forms_data["data"]["forms"]) > 0:
                    # Use the first form for PDF generation test
                    form = forms_data["data"]["forms"][0]
                    form_id = form["_id"]
                    
                    # Test PDF generation endpoint
                    pdf_data = {
                        "includeApprovalHistory": True,
                        "organizationLogo": "https://example.com/logo.png",
                        "organizationName": "Test Organization"
                    }
                    
                    self.run_test(
                        "Generate PDF Data",
                        "POST",
                        f"hrms/forms/manpower_requisition/{form_id}/generate-pdf",
                        200,
                        data=pdf_data
                    )
                else:
                    print("⚠️ No forms found to test PDF generation")
            except Exception as e:
                print(f"Error in PDF generation test: {str(e)}")
        
    def print_summary(self):
        """Print test summary"""
        print("\n=== Test Summary ===")
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        
        if self.tests_passed == self.tests_run:
            print("\n✅ All tests passed!")
        else:
            print("\n❌ Some tests failed")
            
            # Print failed tests
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"- {result['name']} ({result['method']} {result['endpoint']})")
                    print(f"  Expected status: {result['expected_status']}, Got: {result.get('actual_status', 'N/A')}")
                    if "error" in result:
                        print(f"  Error: {result['error']}")
                    print()
        
        return self.tests_passed == self.tests_run

def main():
    # Get base URL from command line if provided
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000/api"
    
    print(f"Testing HRMS API at {base_url}")
    tester = HRMSAPITester(base_url)
    
    # Run tests
    tester.test_approval_flow_endpoints()
    tester.test_pdf_generation_endpoint()
    
    # Print summary
    success = tester.print_summary()
    
    # Return exit code based on test results
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())