"""
AuditLogMiddleware for automatic request tracking.
Currently a placeholder - explicit audit logging is done via record_audit_log().

Future enhancements:
- Auto-log failed authentication attempts
- Track all write operations (POST/PUT/PATCH/DELETE)
- Rate limit monitoring
"""


class AuditLogMiddleware:
    """
    Middleware for audit logging context.
    Actual logging happens explicitly via utils.record_audit_log()
    in views and service layers.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Future: could add request metadata to thread-local storage
        # for automatic inclusion in audit logs
        response = self.get_response(request)
        return response