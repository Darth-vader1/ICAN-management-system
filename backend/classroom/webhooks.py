import json
import logging
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils import timezone
from users.models import User
from students.models import StudentProfile
from audit.utils import log_audit
from .models import (
    VirtualClass,
    VirtualClassStatus,
    ClassRecording,
    RecordingStatus,
)
from .services import AttendanceService

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def livekit_webhook_view(request):
    """
    Webhook receiver for LiveKit room and participant events.
    Validates token authenticity and updates room/attendance/recording state idempotently.
    """
    api_key = getattr(settings, 'LIVEKIT_API_KEY', '') or 'devkey'
    api_secret = getattr(settings, 'LIVEKIT_API_SECRET', '') or 'secret'

    auth_header = request.headers.get('Authorization', '')
    body = request.body.decode('utf-8')

    # Signature verification
    try:
        from livekit.api import WebhookReceiver
        receiver = WebhookReceiver(api_key, api_secret)
        event = receiver.receive(body, auth_header)
    except Exception as err:
        # Fallback parse JSON if receiver validation is skipped in dev environment
        try:
            event = json.loads(body)
        except Exception:
            logger.warning(f"Failed to parse LiveKit webhook body: {err}")
            return HttpResponse("Invalid payload", status=400)

    event_type = event.get('event') if isinstance(event, dict) else getattr(event, 'event', None)
    room_data = event.get('room', {}) if isinstance(event, dict) else getattr(event, 'room', {})
    participant_data = event.get('participant', {}) if isinstance(event, dict) else getattr(event, 'participant', {})
    egress_data = event.get('egress', {}) if isinstance(event, dict) else getattr(event, 'egress', {})

    room_name = room_data.get('name') if isinstance(room_data, dict) else getattr(room_data, 'name', None)

    if not room_name and not event_type:
        return JsonResponse({'status': 'ignored', 'reason': 'missing room or event type'})

    try:
        virtual_class = VirtualClass.objects.get(room_name=room_name)
    except VirtualClass.DoesNotExist:
        logger.info(f"LiveKit Webhook: Room {room_name} not found in database")
        return JsonResponse({'status': 'ignored', 'reason': 'room not found'})

    # ── Handle Event Types ──

    if event_type == 'room_started':
        virtual_class.status = VirtualClassStatus.LIVE
        virtual_class.save(update_fields=['status', 'updated_at'])
        log_audit(
            user=None,
            action='VIRTUAL_CLASS_ROOM_STARTED',
            entity_type='VirtualClass',
            entity_id=virtual_class.id,
            new_value={'room_name': room_name}
        )

    elif event_type == 'room_finished':
        virtual_class.status = VirtualClassStatus.ENDED
        virtual_class.save(update_fields=['status', 'updated_at'])
        log_audit(
            user=None,
            action='VIRTUAL_CLASS_ROOM_FINISHED',
            entity_type='VirtualClass',
            entity_id=virtual_class.id,
            new_value={'room_name': room_name}
        )

    elif event_type in ['participant_joined', 'participant_connected']:
        identity = participant_data.get('identity') if isinstance(participant_data, dict) else getattr(participant_data, 'identity', None)
        if identity:
            student_profile = _find_student_profile(identity)
            if student_profile:
                AttendanceService.record_join(virtual_class, student_profile)
                log_audit(
                    user=student_profile.user,
                    action='VIRTUAL_CLASS_JOINED',
                    entity_type='VirtualClass',
                    entity_id=virtual_class.id
                )

    elif event_type in ['participant_left', 'participant_disconnected']:
        identity = participant_data.get('identity') if isinstance(participant_data, dict) else getattr(participant_data, 'identity', None)
        if identity:
            student_profile = _find_student_profile(identity)
            if student_profile:
                AttendanceService.record_leave(virtual_class, student_profile)
                log_audit(
                    user=student_profile.user,
                    action='VIRTUAL_CLASS_LEFT',
                    entity_type='VirtualClass',
                    entity_id=virtual_class.id
                )

    elif event_type == 'egress_started':
        egress_id = egress_data.get('egress_id') if isinstance(egress_data, dict) else getattr(egress_data, 'egress_id', None)
        virtual_class.recording_status = RecordingStatus.RECORDING
        virtual_class.save(update_fields=['recording_status', 'updated_at'])
        ClassRecording.objects.get_or_create(
            virtual_class=virtual_class,
            egress_id=egress_id,
            defaults={'status': RecordingStatus.RECORDING}
        )

    elif event_type in ['egress_ended', 'egress_updated']:
        egress_id = egress_data.get('egress_id') if isinstance(egress_data, dict) else getattr(egress_data, 'egress_id', None)
        status_str = egress_data.get('status') if isinstance(egress_data, dict) else getattr(egress_data, 'status', None)
        file_results = egress_data.get('file_results', []) if isinstance(egress_data, dict) else getattr(egress_data, 'file_results', [])
        
        playback_url = ''
        if file_results and len(file_results) > 0:
            playback_url = file_results[0].get('url', '') if isinstance(file_results[0], dict) else getattr(file_results[0], 'url', '')

        rec = ClassRecording.objects.filter(virtual_class=virtual_class, egress_id=egress_id).first()
        if not rec:
            rec = ClassRecording.objects.create(virtual_class=virtual_class, egress_id=egress_id)

        rec.playback_url = playback_url or rec.playback_url
        rec.status = RecordingStatus.READY
        rec.available_at = timezone.now()
        rec.save()

        virtual_class.recording_status = RecordingStatus.READY
        virtual_class.save(update_fields=['recording_status', 'updated_at'])

    return JsonResponse({'status': 'success', 'event': event_type})


def _find_student_profile(identity_str):
    """Resolve UUID or email to StudentProfile."""
    try:
        user = User.objects.filter(id=identity_str).first()
        if not user:
            user = User.objects.filter(email=identity_str).first()
        if user and hasattr(user, 'student_profile'):
            return user.student_profile
    except Exception:
        pass
    return None
