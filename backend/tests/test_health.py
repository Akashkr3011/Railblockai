"""
RAILBLOCK AI — Health Endpoint Tests

Tests for GET /api/v1/health
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_health_returns_200():
    """Health endpoint must always return HTTP 200."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_response_structure():
    """Health response must contain required fields."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/health")

    data = response.json()
    assert "status" in data
    assert "application" in data
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data
    assert "database" in data
    assert "optimizer" in data
    assert "ml_service" in data
    assert "simulation" in data


@pytest.mark.asyncio
async def test_health_application_name():
    """Application name must be RAILBLOCK AI."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/health")

    data = response.json()
    assert data["application"] == "RAILBLOCK AI"


@pytest.mark.asyncio
async def test_health_optional_services_disabled():
    """Optional services should be disabled in test environment."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/health")

    data = response.json()
    assert data["optimizer"]["enabled"] is False
    assert data["ml_service"]["enabled"] is False
    assert data["simulation"]["enabled"] is False


@pytest.mark.asyncio
async def test_root_endpoint():
    """Root endpoint must return application info."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert "RAILBLOCK AI" in data["message"]
    assert "health" in data
