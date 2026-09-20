"""
RAILBLOCK AI — API v1 Package
"""
from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.assets import router as assets_router
from app.api.v1.maintenance import router as maintenance_router
from app.api.v1.defects import router as defects_router
from app.api.v1.resources import router as resources_router
from app.api.v1.train_schedules import router as train_schedules_router
from app.api.v1.blocks import router as blocks_router
from app.api.v1.trains import router as trains_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.data_sources import router as data_sources_router
from app.api.v1.priority import router as priority_router
from app.api.v1.compatibility import router as compatibility_router
from app.api.v1.conflicts import router as conflicts_router
from app.api.v1.events import router as events_router
from app.api.v1.simulation import router as simulation_router

router = APIRouter()

router.include_router(health_router,          prefix="/health",          tags=["Health"])
router.include_router(auth_router,            prefix="/auth",            tags=["Auth"])
router.include_router(assets_router,          prefix="/assets",          tags=["Assets"])
router.include_router(maintenance_router,     prefix="/maintenance",     tags=["Maintenance"])
router.include_router(defects_router,         prefix="/defects",         tags=["Defects"])
router.include_router(resources_router,       prefix="/resources",       tags=["Resources"])
router.include_router(train_schedules_router, prefix="/train-schedules", tags=["TrainSchedules"])
router.include_router(blocks_router,          prefix="/blocks",          tags=["Blocks"])
router.include_router(trains_router,          prefix="/trains",          tags=["Trains"])
router.include_router(alerts_router,          prefix="/alerts",          tags=["Alerts"])
router.include_router(data_sources_router,    prefix="/data-sources",    tags=["DataSources"])
router.include_router(priority_router,        prefix="/ai",              tags=["AI/Priority"])
router.include_router(compatibility_router,   prefix="/rules/compatibility", tags=["Rules"])
router.include_router(conflicts_router,       prefix="/rules/conflicts", tags=["Rules"])
router.include_router(events_router,          prefix="/events",          tags=["Events"])
router.include_router(simulation_router,      prefix="/simulation",      tags=["Simulation"])
from .optimization import router as optimization_router
router.include_router(optimization_router)
