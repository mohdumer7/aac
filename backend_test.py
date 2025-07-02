import requests
import json
import sys
from datetime import datetime

class HRMSAPITester:
    def __init__(self, base_url="http://localhost:3000/api"):
        # Use the API_BASE_URL from .env.local
        self.base_url = "http://localhost:3000/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.workflow_id = None
        self.manpower_req_id = None
        self.candidate_info_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        
        if not headers:
            headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        if data:
            print(f"Data: {json.dumps(data, indent=2)}")
        
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
                    print(f"Response: {json.dumps(response.json(), indent=2)}")
                except:
                    result["response"] = "No JSON response"
                    print(f"Response: {response.text}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    result["error"] = response.json()
                    print(f"Error: {json.dumps(response.json(), indent=2)}")
                except:
                    result["error"] = response.text
                    print(f"Error: {response.text}")

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

    def test_master_data_endpoints(self):
        """Test master data endpoints needed for forms"""
        print("\n=== Testing Master Data Endpoints ===")
        
        # Test GET countries (needed for nationality dropdown)
        success, response = self.run_test(
            "Get Countries",
            "GET",
            "master/countries",
            200
        )
        
        if success and response:
            try:
                countries = response.json().get("data", [])
                print(f"Found {len(countries)} countries")
                if len(countries) > 0:
                    print(f"Sample country: {countries[0]}")
            except Exception as e:
                print(f"Error parsing countries: {str(e)}")
        
        # Test GET departments
        success, response = self.run_test(
            "Get Departments",
            "GET",
            "master/departments",
            200
        )
        
        if success and response:
            try:
                departments = response.json().get("data", [])
                print(f"Found {len(departments)} departments")
                if len(departments) > 0:
                    print(f"Sample department: {departments[0]}")
            except Exception as e:
                print(f"Error parsing departments: {str(e)}")

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
                self.workflow_id = workflow_id
                print(f"Created workflow with ID: {workflow_id}")
                
                # Test GET workflow by ID
                self.run_test(
                    "Get Workflow by ID",
                    "GET",
                    f"hrms/workflows/{workflow_id}",
                    200
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
        
        # Test POST create manpower requisition form
        manpower_req_data = {
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
            "Create Manpower Requisition Form",
            "POST",
            "hrms/forms/manpower_requisition",
            201,
            data=manpower_req_data
        )
        
        # If form creation succeeded, store the form ID
        if success and response and response.status_code == 201:
            try:
                form_id = response.json()["data"]["_id"]
                self.manpower_req_id = form_id
                print(f"Created manpower requisition form with ID: {form_id}")
                
                # Test GET form by ID
                self.run_test(
                    "Get Manpower Requisition Form by ID",
                    "GET",
                    f"hrms/forms/manpower_requisition/{form_id}",
                    200
                )
                
                # Test submit form endpoint
                submit_data = {
                    "status": "submitted"
                }
                
                self.run_test(
                    "Submit Manpower Requisition Form",
                    "POST",
                    f"hrms/forms/manpower_requisition/{form_id}/submit",
                    200,
                    data=submit_data
                )
                
            except Exception as e:
                print(f"Error in manpower requisition form tests: {str(e)}")
        
        # Test POST create candidate information form
        candidate_info_data = {
            "positionApplied": "Software Developer",
            "name": "Test Candidate",
            "dateOfBirth": "1990-01-01",
            "nationality": "60f1e5b3e6b3f32d8cde1234",  # This should be a valid country ObjectId
            "gender": "male",
            "maritalStatus": "single",
            "fatherName": "Test Father",
            "motherName": "Test Mother",
            "contactAddressUAE": "Test Address UAE",
            "phoneNumbersUAE": "1234567890",
            "contactAddressHomeCountry": "Test Address Home",
            "phoneNumbersHomeCountry": "0987654321",
            "email": "test@example.com",
            "homeTownCityIntlAirport": "Test Airport",
            "passportNo": "AB123456",
            "passportExpiry": "2030-01-01",
            "currentWorkLocation": "Test Location",
            "currentSalaryPackage": 5000,
            "noticePeriod": "1 month",
            "expectedDOJ": "2025-03-01",
            "sourceOfPositionInfo": "Job Portal",
            "isDraft": False,
            "addedBy": "user123",
            "updatedBy": "user123"
        }
        
        success, response = self.run_test(
            "Create Candidate Information Form",
            "POST",
            "hrms/forms/candidate_information",
            201,
            data=candidate_info_data
        )
        
        # If form creation succeeded, store the form ID
        if success and response and response.status_code == 201:
            try:
                form_id = response.json()["data"]["_id"]
                self.candidate_info_id = form_id
                print(f"Created candidate information form with ID: {form_id}")
                
                # Test GET form by ID
                self.run_test(
                    "Get Candidate Information Form by ID",
                    "GET",
                    f"hrms/forms/candidate_information/{form_id}",
                    200
                )
                
                # Test submit form endpoint
                submit_data = {
                    "status": "submitted"  # This should now use 'submitted' status instead of 'pending_department_head'
                }
                
                self.run_test(
                    "Submit Candidate Information Form",
                    "POST",
                    f"hrms/forms/candidate_information/{form_id}/submit",
                    200,
                    data=submit_data
                )
                
            except Exception as e:
                print(f"Error in candidate information form tests: {str(e)}")
    
    def test_workflow_navigation(self):
        """Test workflow navigation between steps"""
        print("\n=== Testing Workflow Navigation ===")
        
        if not self.workflow_id or not self.manpower_req_id:
            print("❌ Cannot test workflow navigation - missing workflow or form IDs")
            return
        
        # Test advancing workflow from manpower requisition to candidate information
        advance_data = {
            "currentStepIndex": 0,
            "formId": self.manpower_req_id,
            "formData": {
                "position": "Software Developer",
                "department": "Engineering",
                "jobDescription": "Test job description"
            }
        }
        
        success, response = self.run_test(
            "Advance Workflow to Candidate Information",
            "POST",
            f"hrms/workflows/{self.workflow_id}/advance",
            200,
            data=advance_data
        )
        
        if success and self.candidate_info_id:
            # Test advancing workflow from candidate information to next step
            advance_data = {
                "currentStepIndex": 1,
                "formId": self.candidate_info_id,
                "formData": {
                    "name": "Test Candidate",
                    "positionApplied": "Software Developer",
                    "nationality": "60f1e5b3e6b3f32d8cde1234"  # This should be a valid country ObjectId
                }
            }
            
            self.run_test(
                "Advance Workflow from Candidate Information",
                "POST",
                f"hrms/workflows/{self.workflow_id}/advance",
                200,
                data=advance_data
            )
        
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
    tester.test_master_data_endpoints()
    tester.test_workflow_endpoints()
    tester.test_form_endpoints()
    tester.test_workflow_navigation()
    
    # Print summary
    success = tester.print_summary()
    
    # Return exit code based on test results
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())