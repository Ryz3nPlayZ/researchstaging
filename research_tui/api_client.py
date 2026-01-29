"""API Client for Research Pilot backend"""

import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime


class APIClient:
    """Client for communicating with Research Pilot API"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

    async def get_projects(self) -> List[Dict[str, Any]]:
        """Get all projects"""
        response = await self.client.get(f"{self.base_url}/api/projects")
        response.raise_for_status()
        return response.json()

    async def get_project(self, project_id: str) -> Dict[str, Any]:
        """Get project details"""
        response = await self.client.get(f"{self.base_url}/api/projects/{project_id}")
        response.raise_for_status()
        return response.json()

    async def create_project(self, research_goal: str, output_type: str, audience: Optional[str] = None) -> Dict[str, Any]:
        """Create a new project"""
        data = {
            "research_goal": research_goal,
            "output_type": output_type,
            "audience": audience
        }
        response = await self.client.post(f"{self.base_url}/api/projects", json=data)
        response.raise_for_status()
        return response.json()

    async def delete_project(self, project_id: str) -> Dict[str, Any]:
        """Delete a project"""
        response = await self.client.delete(f"{self.base_url}/api/projects/{project_id}")
        response.raise_for_status()
        return response.json()

    async def get_project_tasks(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all tasks for a project"""
        response = await self.client.get(f"{self.base_url}/api/projects/{project_id}/tasks")
        response.raise_for_status()
        return response.json()

    async def get_task(self, task_id: str) -> Dict[str, Any]:
        """Get task details"""
        response = await self.client.get(f"{self.base_url}/api/tasks/{task_id}")
        response.raise_for_status()
        return response.json()

    async def execute_task(self, task_id: str) -> Dict[str, Any]:
        """Execute a task"""
        response = await self.client.post(f"{self.base_url}/api/tasks/{task_id}/execute")
        response.raise_for_status()
        return response.json()

    async def retry_task(self, task_id: str) -> Dict[str, Any]:
        """Retry a failed task"""
        response = await self.client.post(f"{self.base_url}/api/tasks/{task_id}/retry")
        response.raise_for_status()
        return response.json()

    async def get_project_artifacts(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all artifacts for a project"""
        response = await self.client.get(f"{self.base_url}/api/projects/{project_id}/artifacts")
        response.raise_for_status()
        return response.json()

    async def get_artifact(self, artifact_id: str) -> Dict[str, Any]:
        """Get artifact details"""
        response = await self.client.get(f"{self.base_url}/api/artifacts/{artifact_id}")
        response.raise_for_status()
        return response.json()

    async def get_project_papers(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all papers for a project"""
        response = await self.client.get(f"{self.base_url}/api/projects/{project_id}/papers")
        response.raise_for_status()
        return response.json()

    async def get_paper(self, paper_id: str) -> Dict[str, Any]:
        """Get paper details"""
        response = await self.client.get(f"{self.base_url}/api/papers/{paper_id}")
        response.raise_for_status()
        return response.json()

    async def get_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        response = await self.client.get(f"{self.base_url}/api/stats")
        response.raise_for_status()
        return response.json()


# Global client instance
api_client = APIClient()
