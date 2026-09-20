import datetime
from typing import List, Optional

from app.schemas.optimization import OptimizationResult, ComparisonMetrics, ComparisonResult

class ComparisonService:
    """
    Compares the results of BaselineScheduler and CP-SAT OptimizationService.
    Calculates operational metrics to demonstrate objective improvements.
    """
    
    def compare(self, baseline_result: OptimizationResult, optimized_result: OptimizationResult) -> ComparisonResult:
        base_metrics = self._calculate_metrics(baseline_result)
        opt_metrics = self._calculate_metrics(optimized_result)
        
        return ComparisonResult(
            baseline_metrics=base_metrics,
            optimized_metrics=opt_metrics,
            improvement_tasks_scheduled_abs=opt_metrics.tasks_scheduled - base_metrics.tasks_scheduled,
            improvement_tasks_scheduled_pct=self._calc_pct(base_metrics.tasks_scheduled, opt_metrics.tasks_scheduled),
            
            improvement_downtime_abs=base_metrics.asset_downtime_minutes - opt_metrics.asset_downtime_minutes,
            improvement_downtime_pct=self._calc_pct(base_metrics.asset_downtime_minutes, opt_metrics.asset_downtime_minutes, lower_is_better=True),
            
            improvement_block_util_abs=opt_metrics.block_utilization_percent - base_metrics.block_utilization_percent,
            improvement_block_util_pct=self._calc_pct(base_metrics.block_utilization_percent, opt_metrics.block_utilization_percent)
        )
        
    def _calculate_metrics(self, result: OptimizationResult) -> ComparisonMetrics:
        critical_tasks = 0
        overdue_tasks = 0 # Approximated here if we don't have task data, but ideally we'd pass tasks.
        # Actually, let's just count from assignments where priority_level == 'CRITICAL'
        
        total_downtime = 0
        used_blocks = set()
        
        for a in result.assignments:
            if a.is_scheduled:
                if a.priority_level == "CRITICAL":
                    critical_tasks += 1
                    
                dur_mins = int((a.scheduled_end - a.scheduled_start).total_seconds() / 60)
                total_downtime += dur_mins
                
                if a.block_id:
                    used_blocks.add(a.block_id)
                    
        return ComparisonMetrics(
            tasks_scheduled=result.tasks_scheduled,
            critical_tasks_scheduled=critical_tasks,
            overdue_tasks_scheduled=0, # Metric unavailable without raw task deadlines
            asset_downtime_minutes=total_downtime,
            active_blocks=len(used_blocks),
            block_utilization_percent=0.0, # Metric unavailable without block capacity sizes here
            unscheduled_tasks=result.tasks_unscheduled
        )
        
    def _calc_pct(self, base: float, opt: float, lower_is_better: bool = False) -> Optional[float]:
        if base == 0:
            return None
        if lower_is_better:
            return round(((base - opt) / base) * 100.0, 2)
        return round(((opt - base) / base) * 100.0, 2)
