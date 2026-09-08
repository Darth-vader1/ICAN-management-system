from rest_framework import permissions

from .models import Role


class IsSuperAdmin(permissions.BasePermission):
    """Only super admin can access."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == Role.SUPER_ADMIN


class IsITAdminOrAbove(permissions.BasePermission):
    """IT Admin or Super Admin can access."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in {Role.IT_ADMIN, Role.SUPER_ADMIN}
        )


class IsManagerOrAbove(permissions.BasePermission):
    """Manager, IT Admin, or Super Admin can access."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in {Role.MANAGER, Role.IT_ADMIN, Role.SUPER_ADMIN}
        )


class IsFinanceOrAbove(permissions.BasePermission):
    """Finance, Manager, or Super Admin can access."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in {Role.FINANCE, Role.MANAGER, Role.SUPER_ADMIN}
        )


class IsStaffOrAbove(permissions.BasePermission):
    """Any staff role can access."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff_role


class IsSelfOrStaff(permissions.BasePermission):
    """
    Permission check for object-level access.
    Students can only access their own resources.
    Staff can access all resources.
    """

    def has_object_permission(self, request, view, obj):
        # Staff can access everything
        if request.user.is_staff_role:
            return True
        
        # Students can only access their own data
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "student"):
            return obj.student.user == request.user
        
        return False