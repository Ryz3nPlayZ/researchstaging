"""
Backend API Tests for Research Pilot - PostgreSQL/Redis/WebSocket Architecture
Tests all CRUD operations, task graph, agent graph, stats, and project execution endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8000')

# Test project ID - will be set during test execution
TEST_PROJECT_ID = None


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_check_returns_200(self):
        """Test API health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "3.0.0"
        assert "postgresql" in data["features"]
        assert "redis" in data["features"]
        assert "websocket" in data["features"]
        print("✓ Health check passed - API is healthy with PostgreSQL/Redis/WebSocket")


class TestProjectsCRUD:
    """Projects CRUD endpoint tests"""
    
    def test_list_projects(self):
        """Test listing all projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List projects returned {len(data)} projects")
    
    def test_get_existing_project(self):
        """Test getting a specific project"""
        # Create a test project first
        payload = {
            "research_goal": "TEST_Get existing project verification",
            "output_type": "literature_review",
            "audience": "Academic researchers"
        }
        create_response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert create_response.status_code == 200

        project_data = create_response.json()
        project_id = project_data["id"]

        # Now get the project
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == project_id
        assert "research_goal" in data
        assert "output_type" in data
        assert "status" in data
        assert "task_counts" in data
        print(f"✓ Get project returned: {data['research_goal'][:50]}...")

        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")
    
    def test_get_nonexistent_project_returns_404(self):
        """Test getting a non-existent project returns 404"""
        response = requests.get(f"{BASE_URL}/api/projects/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ Non-existent project returns 404")
    
    def test_create_project(self):
        """Test creating a new project"""
        payload = {
            "research_goal": "TEST_Impact of quantum computing on cryptography",
            "output_type": "literature_review",
            "audience": "Academic researchers"
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["research_goal"] == payload["research_goal"]
        assert data["output_type"] == payload["output_type"]
        assert data["status"] in ["created", "planned"]
        
        # Verify project was persisted by fetching it
        get_response = requests.get(f"{BASE_URL}/api/projects/{data['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["research_goal"] == payload["research_goal"]
        
        # Store for cleanup
        self.__class__.created_project_id = data["id"]
        print(f"✓ Created project with ID: {data['id']}")
    
    def test_delete_project(self):
        """Test deleting a project"""
        # Use the project created in previous test
        project_id = getattr(self.__class__, 'created_project_id', None)
        if not project_id:
            pytest.skip("No project to delete - create test may have failed")
        
        response = requests.delete(f"{BASE_URL}/api/projects/{project_id}")
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert get_response.status_code == 404
        print(f"✓ Deleted project {project_id}")


class TestTasksEndpoints:
    """Tasks endpoint tests"""
    
    def test_list_project_tasks(self):
        """Test listing tasks for a project"""
        # Create a test project first
        payload = {
            "research_goal": "TEST_List tasks verification",
            "output_type": "literature_review",
            "audience": "Academic researchers"
        }
        create_response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert create_response.status_code == 200

        project_data = create_response.json()
        project_id = project_data["id"]

        response = requests.get(f"{BASE_URL}/api/projects/{project_id}/tasks")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        # Note: New projects might not have tasks yet, so don't assert len(data) > 0

        # Verify task structure if tasks exist
        if data:
            task = data[0]
            assert "id" in task
            assert "name" in task
            assert "task_type" in task
            assert "state" in task  # Note: uses 'state' not 'status'
            assert "phase_index" in task
            print(f"✓ List tasks returned {len(data)} tasks")
        else:
            print("✓ List tasks returned empty list (no tasks yet)")

        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")
    
    def test_task_graph_endpoint(self):
        """Test task DAG visualization endpoint"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/task-graph")
        assert response.status_code == 200
        
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        assert isinstance(data["nodes"], list)
        assert isinstance(data["edges"], list)
        
        # Verify node structure for React Flow
        if data["nodes"]:
            node = data["nodes"][0]
            assert "id" in node
            assert "type" in node
            assert "position" in node
            assert "data" in node
            assert "x" in node["position"]
            assert "y" in node["position"]
        
        print(f"✓ Task graph returned {len(data['nodes'])} nodes and {len(data['edges'])} edges")
    
    def test_agent_graph_endpoint(self):
        """Test agent orchestration graph endpoint"""
        # Create a test project first
        payload = {
            "research_goal": "TEST_Agent graph verification",
            "output_type": "literature_review",
            "audience": "Academic researchers"
        }
        create_response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert create_response.status_code == 200

        project_data = create_response.json()
        project_id = project_data["id"]

        response = requests.get(f"{BASE_URL}/api/projects/{project_id}/agent-graph")
        assert response.status_code == 200

        data = response.json()
        assert "nodes" in data
        assert "edges" in data

        # Verify GSD agent nodes
        agent_names = [n["data"]["label"] for n in data["nodes"]]
        assert "Orchestrator" in agent_names
        assert "Executor Agents" in agent_names
        assert "Verifier Agents" in agent_names

        print(f"✓ Agent graph returned {len(data['nodes'])} agents")

        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestStatsEndpoint:
    """Stats endpoint tests"""
    
    def test_global_stats(self):
        """Test global statistics endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "projects" in data
        assert "tasks" in data
        assert "artifacts" in data
        assert "papers" in data
        assert "task_breakdown" in data
        
        assert isinstance(data["projects"], int)
        assert isinstance(data["tasks"], int)
        print(f"✓ Stats: {data['projects']} projects, {data['tasks']} tasks")


class TestArtifactsEndpoints:
    """Artifacts endpoint tests"""
    
    def test_list_project_artifacts(self):
        """Test listing artifacts for a project"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/artifacts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List artifacts returned {len(data)} artifacts")


class TestPapersEndpoints:
    """Papers endpoint tests"""
    
    def test_list_project_papers(self):
        """Test listing papers for a project"""
        response = requests.get(f"{BASE_URL}/api/projects/{TEST_PROJECT_ID}/papers")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List papers returned {len(data)} papers")


class TestExecutionEndpoints:
    """Project execution endpoint tests"""
    
    def test_execute_all_endpoint_exists(self):
        """Test execute-all endpoint returns valid response"""
        # Create a test project first
        payload = {
            "research_goal": "TEST_Execution endpoint test project",
            "output_type": "research_brief",
            "audience": "General"
        }
        create_response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert create_response.status_code == 200
        project_id = create_response.json()["id"]
        
        # Test execute-all endpoint
        response = requests.post(f"{BASE_URL}/api/projects/{project_id}/execute-all")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "project_id" in data
        print(f"✓ Execute-all endpoint works: {data['message']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestExportFormats:
    """Export formats endpoint tests"""
    
    def test_get_export_formats(self):
        """Test getting available export formats"""
        response = requests.get(f"{BASE_URL}/api/export/formats")
        assert response.status_code == 200
        
        data = response.json()
        assert "formats" in data
        print(f"✓ Export formats: {data['formats']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
