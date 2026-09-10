from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def structured_exception_handler(exc, context):
    """
    Wraps DRF's default handler to guarantee a consistent {"detail", "code", "field_errors"}
    envelope, while preserving exact validation messages for clients.
    """
    # Catch ProtectedError when deleting objects with foreign key protection
    if isinstance(exc, ProtectedError):
        protected_objects = list(exc.protected_objects)
        count = len(protected_objects)
        first_obj_name = str(protected_objects[0]) if count > 0 else "another record"
        message = (
            f"Cannot delete this item because it is referenced by {count} associated record(s) "
            f"(e.g., '{first_obj_name}'). Please delete or reassign dependent records first, "
            f"or deactivate this item instead."
        )
        return Response(
            {
                "detail": message,
                "code": "protected_error",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Catch database IntegrityError (e.g. unique constraint violations)
    if isinstance(exc, IntegrityError) and not isinstance(exc, ProtectedError):
        return Response(
            {
                "detail": "Database error: A record with this information already exists or violates database constraints.",
                "code": "integrity_error",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    response = exception_handler(exc, context)

    if response is not None:
        data = response.data
        detail = None
        field_errors = None

        if isinstance(data, dict):
            if "detail" in data:
                detail = data["detail"]
                if isinstance(detail, list):
                    detail = " ".join([str(item) for item in detail])
            else:
                # Dict of field validation errors, e.g. {"email": ["..."], "phone": ["..."]}
                field_errors = data
                messages = []
                for field, errs in data.items():
                    if isinstance(errs, list):
                        err_str = ", ".join([str(e) for e in errs])
                    else:
                        err_str = str(errs)
                    
                    if field in ("non_field_errors", "detail"):
                        messages.append(err_str)
                    else:
                        field_name = field.replace("_", " ").title()
                        messages.append(f"{field_name}: {err_str}")
                
                if messages:
                    detail = " | ".join(messages)
        elif isinstance(data, list):
            detail = " ".join([str(item) for item in data])
        elif isinstance(data, str):
            detail = data

        if not detail or not isinstance(detail, str):
            detail = "Request could not be completed."

        res_data = {
            "detail": detail,
            "code": getattr(exc, "default_code", exc.__class__.__name__.lower()),
        }
        if field_errors:
            res_data["field_errors"] = field_errors

        response.data = res_data

    return response