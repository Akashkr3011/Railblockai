import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
import uuid

class DummyUser:
    id = uuid.uuid4()
    role = UserRole.PLANNER_CONTROLLER
    email = "planner.test@railblock.sim"

@pytest.mark.asyncio
async def test_solve_endpoint():
    app.dependency_overrides[get_current_user] = lambda: DummyUser()
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/optimization/solve",
                json={"horizon": "24_HOURS", "corridor": "CR-MUM-ALL"}
            )
        assert response.status_code == 200, response.text
        data = response.json()
        assert "status" in data
        assert "solver" in data
        assert data["solver"]["name"] == "OR-Tools CP-SAT"
        assert "run_id" in data
        assert "proposed_assignments" in data
        assert "metrics_comparison" in data
        assert "baseline" in data
        assert "optimized" in data
        assert "improvement" in data
    finally:
        app.dependency_overrides.clear()
