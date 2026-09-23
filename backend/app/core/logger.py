"""
Structured logging configuration using structlog.
All application modules should import `logger` from here.

Usage:
    from app.core.logger import get_logger
    logger = get_logger(__name__)
    logger.info("model_loaded", domain="paysim", file="ensemble_model.joblib")
    logger.error("model_load_failed", domain="spatial", error=str(e))
"""
import logging
import os
import structlog

_LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
_IS_PRODUCTION = os.getenv("ENV", "development").lower() == "production"

# Configure stdlib logging first (structlog wraps it)
logging.basicConfig(
    format="%(message)s",
    level=getattr(logging, _LOG_LEVEL, logging.INFO),
)

_processors = [
    structlog.contextvars.merge_contextvars,
    structlog.stdlib.add_log_level,
    structlog.stdlib.add_logger_name,
    structlog.processors.TimeStamper(fmt="iso"),
    structlog.processors.StackInfoRenderer(),
]

if _IS_PRODUCTION:
    # JSON output for log aggregation (Datadog, CloudWatch, etc.)
    _processors.append(structlog.processors.JSONRenderer())
else:
    # Human-readable coloured output for local development
    _processors.append(structlog.dev.ConsoleRenderer(colors=True))

structlog.configure(
    processors=_processors,
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)


def get_logger(name: str = __name__) -> structlog.stdlib.BoundLogger:
    """Returns a bound structlog logger for the given module name."""
    return structlog.get_logger(name)
