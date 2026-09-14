import os
import time
from datetime import datetime, timedelta
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from .models import (
    VirtualClass,
    ClassAttendance,
    ClassParticipation,
    AttendanceStatus,
    VirtualClassStatus,
)


class LiveKitService:
    """
    Handles LiveKit Access Token generation and room management.
    """

    @staticmethod
    def generate_token(user, virtual_class: VirtualClass, role: str) -> dict:
        """
        Generate short-lived LiveKit token for user to join classroom.
        """
        api_key = getattr(settings, 'LIVEKIT_API_KEY', 'devkey') or os.environ.get('LIVEKIT_API_KEY', 'devkey')
        api_secret = getattr(settings, 'LIVEKIT_API_SECRET', 'secret') or os.environ.get('LIVEKIT_API_SECRET', 'secret')
        livekit_url = getattr(settings, 'LIVEKIT_URL', 'wss://livekit.example.com') or os.environ.get('LIVEKIT_URL', 'wss://livekit.example.com')

        identity = str(user.id)
        display_name = user.full_name or user.email.split('@')[0]
        room_name = virtual_class.room_name

        is_instructor = (user.is_staff_role or virtual_class.instructor == user)

        # Attempt using official livekit-api SDK if available, fallback to custom JWT if unavailable
        try:
            from livekit.api import AccessToken, VideoGrants
            
            grant = VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
                room_admin=is_instructor,
            )

            token_obj = AccessToken(api_key, api_secret)
            token_obj.with_identity(identity)
            token_obj.with_name(display_name)
            token_obj.with_grants(grant)
            token_obj.with_ttl(timedelta(hours=6))

            token = token_obj.to_jwt()
        except Exception as e:
            # Simple fallback token string if SDK not instantiated
            import jwt
            payload = {
                'iss': api_key,
                'sub': identity,
                'name': display_name,
                'nbf': int(time.time()),
                'exp': int(time.time()) + 21600,
                'video': {
                    'roomJoin': True,
                    'room': room_name,
                    'canPublish': True,
                    'canSubscribe': True,
                    'canPublishData': True,
                    'roomAdmin': is_instructor,
                }
            }
            token = jwt.encode(payload, api_secret, algorithm='HS256')

        return {
            'token': token,
            'url': livekit_url,
            'room_name': room_name,
            'identity': identity,
            'display_name': display_name,
            'role': 'instructor' if is_instructor else 'student',
            'is_instructor': is_instructor,
            'can_screen_share': is_instructor,
            'can_moderate': is_instructor,
        }


class AttendanceService:
    """
    Centralized service for recording virtual class join/leave events and calculating thresholds.
    """

    # Session timeout threshold (in minutes)
    SESSION_TIMEOUT_MINUTES = 30

    @staticmethod
    @transaction.atomic
    def record_join(virtual_class: VirtualClass, student_profile, join_time=None):
        """
        Record student joining a class. Prevents duplicate open sessions.
        Automatically closes stale sessions before creating new ones.
        """
        if join_time is None:
            join_time = timezone.now()

        # Get or create attendance record
        attendance, created = ClassAttendance.objects.select_for_update().get_or_create(
            virtual_class=virtual_class,
            student=student_profile,
            defaults={'first_joined_at': join_time}
        )

        if not attendance.first_joined_at:
            attendance.first_joined_at = join_time
            attendance.save(update_fields=['first_joined_at', 'updated_at'])

        # Close any stale unclosed participation sessions (older than SESSION_TIMEOUT_MINUTES)
        timeout_threshold = timezone.now() - timedelta(minutes=AttendanceService.SESSION_TIMEOUT_MINUTES)
        stale_sessions = attendance.participations.filter(
            left_at__isnull=True,
            joined_at__lt=timeout_threshold
        )
        
        for stale in stale_sessions:
            # Auto-close stale session with timeout duration
            stale.left_at = stale.joined_at + timedelta(minutes=AttendanceService.SESSION_TIMEOUT_MINUTES)
            stale.duration_seconds = AttendanceService.SESSION_TIMEOUT_MINUTES * 60
            stale.save(update_fields=['left_at', 'duration_seconds', 'updated_at'])

        # Check if there is an active (non-stale) unclosed participation session
        active_participation = attendance.participations.filter(
            left_at__isnull=True,
            joined_at__gte=timeout_threshold
        ).first()
        
        if not active_participation:
            # Create new participation session (use get_or_create to prevent duplicates)
            ClassParticipation.objects.get_or_create(
                attendance=attendance,
                joined_at=join_time,
                left_at=None,
                defaults={'duration_seconds': 0}
            )

        return attendance

    @staticmethod
    @transaction.atomic
    def record_leave(virtual_class: VirtualClass, student_profile, leave_time=None):
        """
        Record student leaving a class and update aggregated duration & threshold status.
        Uses database transaction to prevent race conditions.
        """
        if leave_time is None:
            leave_time = timezone.now()

        try:
            attendance = ClassAttendance.objects.select_for_update().get(
                virtual_class=virtual_class, 
                student=student_profile
            )
        except ClassAttendance.DoesNotExist:
            return None

        # Close any open active participation sessions
        active_participations = attendance.participations.filter(left_at__isnull=True)
        for p in active_participations:
            p.left_at = leave_time
            p.duration_seconds = max(0, int((leave_time - p.joined_at).total_seconds()))
            p.save(update_fields=['left_at', 'duration_seconds', 'updated_at'])

        attendance.last_left_at = leave_time

        # Calculate total accumulated duration in seconds across all closed sessions
        total_seconds = sum(
            p.duration_seconds for p in attendance.participations.filter(left_at__isnull=False)
        )
        attendance.total_duration_seconds = total_seconds

        # Calculate attendance status threshold
        scheduled_seconds = virtual_class.total_scheduled_duration_minutes * 60
        if scheduled_seconds <= 0:
            scheduled_seconds = 3600  # Default 1 hour fallback

        ratio = total_seconds / float(scheduled_seconds)
        if ratio >= 0.75:
            attendance.attendance_status = AttendanceStatus.PRESENT
        elif ratio >= 0.25:
            attendance.attendance_status = AttendanceStatus.PARTIAL
        else:
            attendance.attendance_status = AttendanceStatus.ABSENT

        attendance.save(update_fields=[
            'last_left_at', 
            'total_duration_seconds', 
            'attendance_status', 
            'updated_at'
        ])
        return attendance

    @staticmethod
    @transaction.atomic
    def close_stale_sessions(virtual_class: VirtualClass = None):
        """
        Cleanup utility: Close all stale unclosed sessions across all or specific virtual classes.
        Should be run periodically via Celery task.
        """
        timeout_threshold = timezone.now() - timedelta(minutes=AttendanceService.SESSION_TIMEOUT_MINUTES)
        
        # Build query
        query = ClassParticipation.objects.filter(
            left_at__isnull=True,
            joined_at__lt=timeout_threshold
        )
        
        if virtual_class:
            query = query.filter(attendance__virtual_class=virtual_class)
        
        stale_count = 0
        for participation in query.select_related('attendance'):
            participation.left_at = participation.joined_at + timedelta(
                minutes=AttendanceService.SESSION_TIMEOUT_MINUTES
            )
            participation.duration_seconds = AttendanceService.SESSION_TIMEOUT_MINUTES * 60
            participation.save(update_fields=['left_at', 'duration_seconds', 'updated_at'])
            
            # Recalculate attendance totals
            AttendanceService.record_leave(
                participation.attendance.virtual_class,
                participation.attendance.student,
                participation.left_at
            )
            stale_count += 1
        
        return stale_count
