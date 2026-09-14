from rest_framework import permissions
from users.models import Role


class IsClassInstructorOrStaff(permissions.BasePermission):
    """
    Grants permission if user is staff (Super Admin, Manager, Student Officer)
    or the assigned instructor for the virtual class.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Staff roles have permission
        if request.user.is_staff_role:
            return True

        # Check if user is instructor of virtual_class or object's virtual_class
        virtual_class = obj if hasattr(obj, 'instructor') else getattr(obj, 'virtual_class', None)
        if virtual_class and virtual_class.instructor and virtual_class.instructor == request.user:
            return True

        return False


class IsClassParticipantOrStaff(permissions.BasePermission):
    """
    Checks if student is actively enrolled in the course offering for this virtual class,
    or if user is staff/instructor.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Staff can access
        if request.user.is_staff_role:
            return True

        # Extract target virtual class
        virtual_class = obj if hasattr(obj, 'course_offering') else getattr(obj, 'virtual_class', None)
        if not virtual_class:
            return False

        # If user is instructor (with null check)
        if virtual_class.instructor and virtual_class.instructor == request.user:
            return True

        # If user is student, check active enrollment
        if hasattr(request.user, 'student_profile') and request.user.student_profile:
            from enrollments.models import EnrollmentCourse
            return EnrollmentCourse.objects.filter(
                enrollment__student=request.user.student_profile,
                course_offering=virtual_class.course_offering,
                enrollment__status='active',
                dropped=False
            ).exists()

        return False
