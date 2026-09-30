"""
Custom JSON Log Formatter for ICAN Platform.
Uses python-json-logger when installed, with a reliable pure-python fallback.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

try:
    from pythonjsonlogger import jsonlogger

    class CustomJsonFormatter(jsonlogger.JsonFormatter):
        """
        python-json-logger based JSON formatter.
        Injects UTC ISO timestamp, normalized uppercase level, and correlation request_id.
        """
        def add_fields(
            self,
            log_record: dict[str, Any],
            record: logging.LogRecord,
            message_dict: dict[str, Any],
        ) -> None:
            super().add_fields(log_record, record, message_dict)
            if not log_record.get("timestamp"):
                log_record["timestamp"] = datetime.now(timezone.utc).strftime(
                    "%Y-%m-%dT%H:%M:%S.%fZ"
                )
            if log_record.get("level"):
                log_record["level"] = str(log_record["level"]).upper()
            else:
                log_record["level"] = record.levelname

            req_id = getattr(record, "request_id", None) or log_record.get("request_id")
            if req_id and req_id != "-":
                log_record["request_id"] = req_id
            elif "request_id" in log_record and log_record["request_id"] == "-":
                log_record.pop("request_id", None)

except ImportError:
    class CustomJsonFormatter(logging.Formatter):  # type: ignore[no-redef]
        """
        Pure-python fallback JSON formatter when python-json-logger is not yet installed.
        """
        def format(self, record: logging.LogRecord) -> str:
            req_id = getattr(record, "request_id", None)
            log_data: dict[str, Any] = {
                "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                "level": record.levelname,
                "name": record.name,
                "message": record.getMessage(),
                "module": record.module,
                "process": record.process,
                "thread": record.thread,
            }
            if req_id and req_id != "-":
                log_data["request_id"] = req_id

            if record.exc_info:
                log_data["exc_info"] = self.formatException(record.exc_info)
            if record.stack_info:
                log_data["stack_info"] = self.formatStack(record.stack_info)

            return json.dumps(log_data)
