import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from notifications.models import Notification
from .models import VirtualClass, VirtualClassStatus, ClassRecording

logger = logging.getLogger(__name__)


@shared_task
def send_upcoming_class_reminders():
    """
    Periodic Celery task checking for classes starting in 15 minutes or 24 hours.
    Sends in-app notifications to enrolled students.
    """
    now = timezone.now()
    in_15_mins = now + timedelta(minutes=15)
    in_24_hours = now + timedelta(hours=24)

    # 15-minute reminders
    classes_15m = VirtualClass.objects.filter(
        status=VirtualClassStatus.SCHEDULED,
        scheduled_start__gte=now,
        scheduled_start__lte=in_15_mins
    )

    for vc in classes_15m:
        _notify_enrolled_students(
            virtual_class=vc,
            title=f"Class Starting Soon: {vc.title}",
            message=f"Your live class '{vc.title}' for {vc.course_offering.course.name} starts in 15 minutes.",
            category='academic',
            type_choice='info'
        )

    return f"Processed reminders for {classes_15m.count()} upcoming classes."


@shared_task
def send_class_cancellation_notifications(virtual_class_id):
    """
    Async task triggered when a staff member cancels a scheduled virtual class.
    """
    try:
        vc = VirtualClass.objects.get(id=virtual_class_id)
        _notify_enrolled_students(
            virtual_class=vc,
            title=f"Class Cancelled: {vc.title}",
            message=f"The scheduled class '{vc.title}' for {vc.course_offering.course.name} on {vc.scheduled_start.strftime('%d %b %Y at %H:%M')} has been cancelled.",
            category='academic',
            type_choice='warning'
        )
    except VirtualClass.DoesNotExist:
        logger.error(f"Task error: VirtualClass {virtual_class_id} not found")


@shared_task
def send_recording_available_notifications(recording_id):
    """
    Async task triggered when a class recording playback URL becomes ready.
    """
    try:
        rec = ClassRecording.objects.get(id=recording_id)
        vc = rec.virtual_class
        _notify_enrolled_students(
            virtual_class=vc,
            title=f"Recording Ready: {vc.title}",
            message=f"The video recording for '{vc.title}' ({vc.course_offering.course.code}) is now available for review.",
            category='academic',
            type_choice='success'
        )
    except ClassRecording.DoesNotExist:
        logger.error(f"Task error: ClassRecording {recording_id} not found")


def _notify_enrolled_students(virtual_class, title, message, category='academic', type_choice='info'):
    """Helper to dispatch in-app notifications to active enrolled students."""
    from enrollments.models import EnrollmentCourse

    enrollment_courses = EnrollmentCourse.objects.filter(
        course_offering=virtual_class.course_offering,
        enrollment__status='active',
        dropped=False
    ).select_related('enrollment__student__user')

    notifications = []
    for ec in enrollment_courses:
        user = ec.enrollment.student.user
        notifications.append(
            Notification(
                user=user,
                title=title,
                message=message,
                category=category,
                type=type_choice,
                action_url=f"/classrooms/{virtual_class.id}",
                action_label="View Class"
            )
        )

    if notifications:
        Notification.objects.bulk_create(notifications)


@shared_task
def cleanup_stale_classroom_sessions():
    """
    Periodic Celery task (runs every 30 minutes) to close stale unclosed participation sessions.
    Prevents attendance duration inflation from browser crashes, network disconnects, etc.
    """
    from .services import AttendanceService
    
    try:
        stale_count = AttendanceService.close_stale_sessions()
        logger.info(f"Closed {stale_count} stale classroom participation sessions")
        return f"Successfully closed {stale_count} stale sessions"
    except Exception as e:
        logger.error(f"Error cleaning up stale classroom sessions: {e}")
        return f"Error: {str(e)}"
