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

    def test_workflow_endpoints(self):
        """Test HRMS workflow endpoints"""
        print("\n=== Testing HRMS Workflow Endpoints ===")
        
        # Test GET workflows
        self.run_test(
            "Get Workflows",
            "GET",
            "hrms/workflows",
            200
        )
        
        # Test POST create workflow
        workflow_data = {
            "workflowType": "recruitment",
            "metadata": {
                "requestedBy": "Test User",
                "requestedById": "user123",
                "position": "Software Developer",
                "department": "Engineering",
                "departmentId": "dept123",
                "expectedEndDate": "2025-03-01",
                "comments": "Test workflow created by API test"
            },
            "currentStepIndex": 0,
            "steps": [
                {
                    "stepIndex": 0,
                    "stepName": "Manpower Requisition",
                    "formType": "manpower_requisition",
                    "status": "not_started",
                    "isRequired": True
                },
                {
                    "stepIndex": 1,
                    "stepName": "Candidate Information",
                    "formType": "candidate_information",
                    "status": "not_started",
                    "isRequired": True
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Workflow",
            "POST",
            "hrms/workflows",
            201,
            data=workflow_data
        )
        
        # If workflow creation succeeded, test other endpoints with the created workflow
        if success and response and response.status_code == 201:
            try:
                workflow_id = response.json()["data"]["_id"]
                
                # Test GET workflow by ID
                self.run_test(
                    "Get Workflow by ID",
                    "GET",
                    f"hrms/workflows/{workflow_id}",
                    200
                )
                
                # Test workflow advance endpoint
                advance_data = {
                    "currentStepIndex": 0,
                    "formId": "form123",
                    "formData": {
                        "position": "Software Developer",
                        "department": "Engineering",
                        "jobDescription": "Test job description"
                    }
                }
                
                self.run_test(
                    "Advance Workflow",
                    "POST",
                    f"hrms/workflows/{workflow_id}/advance",
                    200,
                    data=advance_data
                )
                
            except Exception as e:
                print(f"Error in workflow tests: {str(e)}")
    
    def test_form_endpoints(self):
        """Test HRMS form endpoints"""
        print("\n=== Testing HRMS Form Endpoints ===")
        
        # Test GET form types
        form_types = ["manpower_requisition", "candidate_information"]
        
        for form_type in form_types:
            self.run_test(
                f"Get {form_type} Forms",
                "GET",
                f"hrms/forms/{form_type}",
                200
            )
        
        # Test POST create form
        form_data = {
            "position": "Software Developer",
            "department": "Engineering",
            "departmentId": "dept123",
            "jobDescription": "Test job description",
            "requiredSkills": ["JavaScript", "React", "Node.js"],
            "experienceRequired": "3-5 years",
            "educationRequired": "Bachelor's degree",
            "requestedBy": "Test User",
            "requestedById": "user123",
            "isDraft": False
        }
        
        success, response = self.run_test(
            "Create Form",
            "POST",
            "hrms/forms/manpower_requisition",
            201,
            data=form_data
        )
        
        # If form creation succeeded, test other endpoints with the created form
        if success and response and response.status_code == 201:
            try:
                form_id = response.json()["data"]["_id"]
                
                # Test GET form by ID
                self.run_test(
                    "Get Form by ID",
                    "GET",
                    f"hrms/forms/manpower_requisition/{form_id}",
                    200
                )
                
                # Test save draft endpoint
                draft_data = {
                    "position": "Senior Software Developer",
                    "department": "Engineering",
                    "departmentId": "dept123",
                    "jobDescription": "Updated job description",
                    "isDraft": True
                }
                
                self.run_test(
                    "Save Form Draft",
                    "POST",
                    f"hrms/forms/manpower_requisition/{form_id}/save-draft",
                    200,
                    data=draft_data
                )
                
                # Test submit form endpoint
                submit_data = {
                    "position": "Senior Software Developer",
                    "department": "Engineering",
                    "departmentId": "dept123",
                    "jobDescription": "Final job description",
                    "requiredSkills": ["JavaScript", "React", "Node.js", "TypeScript"],
                    "experienceRequired": "3-5 years",
                    "educationRequired": "Bachelor's degree",
                    "requestedBy": "Test User",
                    "requestedById": "user123",
                    "isDraft": False
                }
                
                self.run_test(
                    "Submit Form",
                    "POST",
                    f"hrms/forms/manpower_requisition/{form_id}/submit",
                    200,
                    data=submit_data
                )
                
            except Exception as e:
                print(f"Error in form tests: {str(e)}")
        
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
    tester.test_workflow_endpoints()
    tester.test_form_endpoints()
    
    # Print summary
    success = tester.print_summary()
    
    # Return exit code based on test results
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())