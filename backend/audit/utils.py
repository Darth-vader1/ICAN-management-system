def _client_ip(request):
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def record_audit_log(*, actor, action, entity_type, entity_id, old_value=None, new_value=None, request=None):
    """
    Single entry point for writing audit records. Call this from services,
    not from views directly, so financial/permission-sensitive actions are
    always logged even when triggered from a background task or webhook.
    """
    from .models import AuditLog

    AuditLog.objects.create(
        actor=actor if getattr(actor, "is_authenticated", True) else None,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        old_value=old_value,
        new_value=new_value,
        ip_address=_client_ip(request),
    )


# Alias for convenience
def log_audit(user, action, entity_type, entity_id, old_value=None, new_value=None, request=None):
    """
    Convenience wrapper for record_audit_log.
    Accepts 'user' instead of 'actor' for simpler usage.
    """
    return record_audit_log(
        actor=user,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
        request=request
    )