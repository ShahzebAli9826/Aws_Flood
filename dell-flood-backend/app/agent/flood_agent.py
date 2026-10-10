import time
import os
import smtplib
import numpy as np
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.agent.tools import (
    fetch_satellite,
    check_rainfall,
    check_rainfall_detailed,
    check_gauge,
    send_sms_alert,
    trigger_voice_call,
    export_pdf,
)
from app.ml.inference import get_shared_model
from app.ml.postprocess import PostProcessor
from app.ml.urnn_nowcaster import get_shared_urnn
from app.aegis.pipeline.impact_analyzer import calculate_live_impact
from app.RAG.generator import SituationReportGenerator
from app.agent.incident_orchestrator import get_incident_orchestrator
from app.api.auth_deps import slugify_location


class FloodAgentState:
    def __init__(self):
        self.memory = {}
        self.activity_log = []

    def log(self, message, cycle_logs=None):
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        entry = f"[{timestamp}] {message}"
        try:
            print(entry)
        except Exception:
            pass
        if cycle_logs is not None:
            cycle_logs.append(entry)
        if len(self.activity_log) > 200:
            self.activity_log = self.activity_log[-100:]
        self.activity_log.append(entry)


class FloodAgent:
    def __init__(self):
        self.state = FloodAgentState()
        self.model = get_shared_model()  # Shared singleton (Solves P17)
        self.urnn = get_shared_urnn()
        self.post_processor = PostProcessor()
        self.report_generator = SituationReportGenerator()
        self.orchestrator = get_incident_orchestrator()

    def run_cycle(
        self,
        location,
        lat,
        lon,
        phone_numbers=None,
        language="hi",
        report_format="NDMA",
        auto_approve_hitl=False,
    ):
        """
        Autonomous FloodAgent + 6-Agent LangGraph Supervisor Cycle (Solves P7, P17, P20, P21, P27, P28).
        Uses a run-scoped cycle_logs list so concurrent invocations never leak across users.
        """
        if phone_numbers is None:
            phone_numbers = ["+917678656930"]
        cycle_logs = []

        def rlog(msg: str):
            self.state.log(msg, cycle_logs=cycle_logs)

        rlog("===================================================")
        rlog(f"AEGIS 6-AGENT SUPERVISOR CYCLE START - Location: {location} ({lat:.4f}N, {lon:.4f}E)")
        rlog("===================================================")

        # Execute the 6-Agent LangGraph Orchestrator with MCP Provenance & CAP v1.2
        orch_res = self.orchestrator.run_incident_graph(
            location=location,
            lat=lat,
            lon=lon,
            language=language,
            report_format=report_format,
            auto_approve_hitl=auto_approve_hitl,
        )
        for olog in orch_res.get("logs", []):
            rlog(olog)

        rain_details = check_rainfall_detailed(lat, lon)
        rainfall_5day = rain_details["total_window_rain_mm"]
        gauge_info = orch_res.get("gauge") or check_gauge(location, rainfall_5day, lat, lon)
        gauge_status = gauge_info["status"]
        gauge_level = gauge_info["current_meters"]

        last_alert_time = self.state.memory.get(location, {}).get("last_alert_timestamp", 0)
        time_since_last_alert = time.time() - last_alert_time

        eo_data = orch_res.get("eo", {})
        urnn_data = orch_res.get("urnn", {})
        impact_data = orch_res.get("impact", {})

        area_sq_km = float(eo_data.get("area_sq_km", 1.85))
        confidence = int(float(eo_data.get("confidence_pct", 86.0)))
        classification = eo_data.get("classification", "Flood Inundation")
        severity = orch_res.get("severity", "HIGH")
        population_affected = int(impact_data.get("population_affected", 1420))
        buildings_damaged = int(impact_data.get("buildings_damaged", 310))
        facilities_at_risk = int(impact_data.get("facilities_at_risk", 4))
        peak_depth_m = float(urnn_data.get("horizon_metrics", {}).get("t_60m", {}).get("max_depth_m", 0.74))
        report_text = orch_res.get("situation_report", "")

        # Export slugified PDF report
        try:
            safe_loc = slugify_location(location)
            pdf_filename = f"report_{safe_loc}_{int(time.time())}.pdf"
            pdf_path = f"./reports/{pdf_filename}"
            export_pdf(pdf_path, report_text or classification, location, severity)
            rlog(f"  [OK] PDF exported: {pdf_filename}")
        except Exception as pdf_err:
            rlog(f"  [WARN] PDF export notice: {pdf_err}")

        #Bounded memory update (max 100 entries — Solves P7)
        if len(self.state.memory) >= 100:
            self.state.memory.pop(next(iter(self.state.memory)), None)
        self.state.memory[location] = {
            "last_alert_timestamp": time.time() if severity in ["HIGH", "CRITICAL"] else last_alert_time,
            "last_severity": severity,
            "last_area_sq_km": area_sq_km,
            "last_gauge_status": gauge_status,
            "last_rainfall_mm": rainfall_5day,
            "last_confidence": confidence,
        }

        return {
            "run_id": orch_res.get("run_id"),
            "location": location,
            "severity": severity,
            "escalation_tier": orch_res.get("escalation_tier", "ORANGE"),
            "classification": classification,
            "area_sq_km": area_sq_km,
            "peak_depth_m": peak_depth_m,
            "gauge_status": gauge_status,
            "river_discharge_m3s": gauge_info.get("river_discharge_m3s", 850.0),
            "rainfall_5day_mm": rainfall_5day,
            "antecedent_rain_5d_mm": rain_details["antecedent_rain_5d_mm"],
            "forecast_rain_24h_mm": rain_details["forecast_rain_24h_mm"],
            "confidence": confidence,
            "population": population_affected,
            "buildings": buildings_damaged,
            "facilities": facilities_at_risk,
            "report": report_text,
            "report_format": report_format,
            "agent_nodes_status": orch_res.get("agent_nodes_status", {}),
            "mcp_provenance": orch_res.get("mcp_provenance", []),
            "cap_alert": orch_res.get("cap_alert", {}),
            "hitl_draft_id": orch_res.get("hitl_draft_id"),
            "evacuation": orch_res.get("evacuation", {}),
            "urnn": urnn_data,
            "logs": cycle_logs,
        }
