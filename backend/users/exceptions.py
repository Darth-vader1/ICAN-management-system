from rest_framework.views import exception_handler


def structured_exception_handler(exc, context):
    """
    Wraps DRF's default handler to guarantee a consistent {"detail", "code"}
    envelope, and never lets a raw traceback reach the client.
    """
    response = exception_handler(exc, context)

    if response is not None:
        detail = response.data.get("detail") if isinstance(response.data, dict) else response.data
        response.data = {
            "detail": detail if isinstance(detail, str) else "Request could not be completed.",
            "code": getattr(exc, "default_code", exc.__class__.__name__.lower()),
        }
    return response