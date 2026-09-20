"""RAILBLOCK AI — Data Source Adapters Package

All adapters in this package generate SIMULATED data.
They are designed so that real authorized IR APIs can replace them
without changing the interface.

Data labels: SIMULATED_TMS, SIMULATED_SMMS, SIMULATED_TDMS,
             SIMULATED_COA, SIMULATED_BDMS, SIMULATED_TIMETABLE,
             SIMULATED_GOODS_FORECAST
"""
from app.adapters.tms_adapter import SimulatedTMSAdapter
from app.adapters.smms_adapter import SimulatedSMMSAdapter
from app.adapters.tdms_adapter import SimulatedTDMSAdapter
from app.adapters.coa_adapter import SimulatedCOAAdapter
from app.adapters.bdms_adapter import SimulatedBDMSAdapter
from app.adapters.timetable_adapter import SimulatedTimetableAdapter
from app.adapters.goods_forecast_adapter import SimulatedGoodsForecastAdapter

__all__ = [
    "SimulatedTMSAdapter",
    "SimulatedSMMSAdapter",
    "SimulatedTDMSAdapter",
    "SimulatedCOAAdapter",
    "SimulatedBDMSAdapter",
    "SimulatedTimetableAdapter",
    "SimulatedGoodsForecastAdapter",
]
