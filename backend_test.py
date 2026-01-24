#!/usr/bin/env python3
"""
Research Pilot Backend API Testing Suite
Tests all backend endpoints for functionality and integration
"""
import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

class ResearchPilotAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.task_ids = []
        self.artifact_ids = []
        self.paper_ids = []

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict[str, Any]] = None, timeout: int = 30) -> tuple:
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.text else {}
                except:
                    response_data = {}
                return True, response_data
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "/",
            200
        )
        if success:
            print(f"   API Status: {response.get('status', 'unknown')}")
            print(f"   Version: {response.get('version', 'unknown')}")
        return success

    def test_global_stats(self):
        """Test global statistics endpoint"""
        success, response = self.run_test(
            "Global Statistics",
            "GET",
            "/stats",
            200
        )
        if success:
            print(f"   Projects: {response.get('projects', 0)}")
            print(f"   Tasks: {response.get('tasks', 0)}")
            print(f"   Artifacts: {response.get('artifacts', 0)}")
            print(f"   Papers: {response.get('papers', 0)}")
        return success

    def test_create_project(self):
        """Test project creation"""
        project_data = {
            "research_goal": "Investigating the impact of artificial intelligence on modern healthcare delivery systems and patient outcomes",
            "output_type": "literature_review",
            "audience": "Healthcare professionals and AI researchers"
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "/projects",
            200,
            data=project_data
        )
        
        if success and response.get('id'):
            self.project_id = response['id']
            print(f"   Project ID: {self.project_id}")
            print(f"   Research Goal: {response.get('research_goal', '')[:50]}...")
            # Wait for background task creation
            time.sleep(2)
        return success

    def test_list_projects(self):
        """Test listing projects"""
        success, response = self.run_test(
            "List Projects",
            "GET",
            "/projects",
            200
        )
        if success:
            projects = response if isinstance(response, list) else []
            print(f"   Found {len(projects)} projects")
        return success

    def test_get_project(self):
        """Test getting specific project"""
        if not self.project_id:
            print("❌ Skipped - No project ID available")
            return False
            
        success, response = self.run_test(
            "Get Project by ID",
            "GET",
            f"/projects/{self.project_id}",
            200
        )
        if success:
            print(f"   Status: {response.get('status', 'unknown')}")
            print(f"   Task Counts: {response.get('task_counts', {})}")
        return success

    def test_list_project_tasks(self):
        """Test listing project tasks"""
        if not self.project_id:
            print("❌ Skipped - No project ID available")
            return False
            
        success, response = self.run_test(
            "List Project Tasks",
            "GET",
            f"/projects/{self.project_id}/tasks",
            200
        )
        if success:
            tasks = response if isinstance(response, list) else []
            print(f"   Found {len(tasks)} tasks")
            self.task_ids = [task.get('id') for task in tasks if task.get('id')]
            for task in tasks[:3]:  # Show first 3 tasks
                print(f"   - {task.get('name', 'Unknown')}: {task.get('status', 'unknown')}")
        return success

    def test_list_project_artifacts(self):
        """Test listing project artifacts"""
        if not self.project_id:
            print("❌ Skipped - No project ID available")
            return False
            
        success, response = self.run_test(
            "List Project Artifacts",
            "GET",
            f"/projects/{self.project_id}/artifacts",
            200
        )
        if success:
            artifacts = response if isinstance(response, list) else []
            print(f"   Found {len(artifacts)} artifacts")
            self.artifact_ids = [artifact.get('id') for artifact in artifacts if artifact.get('id')]
        return success

    def test_list_project_papers(self):
        """Test listing project papers"""
        if not self.project_id:
            print("❌ Skipped - No project ID available")
            return False
            
        success, response = self.run_test(
            "List Project Papers",
            "GET",
            f"/projects/{self.project_id}/papers",
            200
        )
        if success:
            papers = response if isinstance(response, list) else []
            print(f"   Found {len(papers)} papers")
            self.paper_ids = [paper.get('id') for paper in papers if paper.get('id')]
        return success

    def test_execute_pipeline(self):
        """Test executing the research pipeline"""
        if not self.project_id:
            print("❌ Skipped - No project ID available")
            return False
            
        success, response = self.run_test(
            "Execute Pipeline",
            "POST",
            f"/projects/{self.project_id}/execute-all",
            200,
            timeout=60
        )
        if success:
            print(f"   Pipeline execution started for project {self.project_id}")
            # Wait a bit for pipeline to start
            time.sleep(3)
        return success

    def test_get_task_details(self):
        """Test getting task details"""
        if not self.task_ids:
            print("❌ Skipped - No task IDs available")
            return False
            
        task_id = self.task_ids[0]
        success, response = self.run_test(
            "Get Task Details",
            "GET",
            f"/tasks/{task_id}",
            200
        )
        if success:
            print(f"   Task: {response.get('name', 'Unknown')}")
            print(f"   Status: {response.get('status', 'unknown')}")
            print(f"   Type: {response.get('task_type', 'unknown')}")
        return success

    def test_get_artifact_details(self):
        """Test getting artifact details"""
        if not self.artifact_ids:
            print("❌ Skipped - No artifact IDs available")
            return False
            
        artifact_id = self.artifact_ids[0]
        success, response = self.run_test(
            "Get Artifact Details",
            "GET",
            f"/artifacts/{artifact_id}",
            200
        )
        if success:
            print(f"   Artifact: {response.get('title', 'Unknown')}")
            print(f"   Type: {response.get('artifact_type', 'unknown')}")
        return success

    def test_get_paper_details(self):
        """Test getting paper details"""
        if not self.paper_ids:
            print("❌ Skipped - No paper IDs available")
            return False
            
        paper_id = self.paper_ids[0]
        success, response = self.run_test(
            "Get Paper Details",
            "GET",
            f"/papers/{paper_id}",
            200
        )
        if success:
            print(f"   Paper: {response.get('title', 'Unknown')[:50]}...")
            print(f"   Source: {response.get('source', 'unknown')}")
            print(f"   Year: {response.get('year', 'unknown')}")
        return success

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Research Pilot Backend API Tests")
        print(f"   Base URL: {self.base_url}")
        print(f"   API Base: {self.api_base}")
        print("=" * 60)

        # Core API tests
        tests = [
            self.test_health_check,
            self.test_global_stats,
            self.test_create_project,
            self.test_list_projects,
            self.test_get_project,
            self.test_list_project_tasks,
            self.test_list_project_artifacts,
            self.test_list_project_papers,
            self.test_execute_pipeline,
        ]

        # Run core tests
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test failed with exception: {e}")
            time.sleep(0.5)  # Brief pause between tests

        # Detail tests (only if we have data)
        detail_tests = [
            self.test_get_task_details,
            self.test_get_artifact_details,
            self.test_get_paper_details,
        ]

        for test in detail_tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test failed with exception: {e}")
            time.sleep(0.5)

        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if self.project_id:
            print(f"   Created Project ID: {self.project_id}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = ResearchPilotAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n❌ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())