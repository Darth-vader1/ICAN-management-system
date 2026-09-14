from rest_framework import serializers
from .models import (
    VirtualClass,
    ClassMaterial,
    ClassRecording,
    ClassAttendance,
    ClassParticipation,
    ClassChatMessage,
    VirtualClassStatus,
    RecordingStatus,
    AttendanceStatus,
)


class ClassMaterialSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = ClassMaterial
        fields = [
            'id',
            'virtual_class',
            'title',
            'description',
            'file',
            'uploaded_by',
            'uploaded_by_name',
            'created_at',
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at']


class ClassRecordingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRecording
        fields = [
            'id',
            'virtual_class',
            'provider',
            'egress_id',
            'playback_url',
            'duration_seconds',
            'status',
            'available_at',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ClassParticipationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassParticipation
        fields = ['id', 'joined_at', 'left_at', 'duration_seconds']


class ClassAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_code = serializers.CharField(source='student.student_code', read_only=True)
    participations = ClassParticipationSerializer(many=True, read_only=True)
    total_duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = ClassAttendance
        fields = [
            'id',
            'virtual_class',
            'student',
            'student_name',
            'student_code',
            'first_joined_at',
            'last_left_at',
            'total_duration_seconds',
            'total_duration_minutes',
            'attendance_status',
            'participations',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']

    def get_total_duration_minutes(self, obj):
        return round(obj.total_duration_seconds / 60, 1)


class VirtualClassListSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course_offering.course.code', read_only=True)
    course_name = serializers.CharField(source='course_offering.course.name', read_only=True)
    level_name = serializers.CharField(source='course_offering.course.level.name', read_only=True)
    session_label = serializers.CharField(source='course_offering.session.label', read_only=True)
    instructor_name = serializers.SerializerMethodField()
    materials_count = serializers.SerializerMethodField()
    recordings_count = serializers.SerializerMethodField()

    class Meta:
        model = VirtualClass
        fields = [
            'id',
            'course_offering',
            'course_code',
            'course_name',
            'level_name',
            'session_label',
            'instructor',
            'instructor_name',
            'title',
            'description',
            'scheduled_start',
            'scheduled_end',
            'status',
            'room_name',
            'recording_enabled',
            'recording_status',
            'materials_count',
            'recordings_count',
            'created_at',
        ]

    def get_instructor_name(self, obj):
        if obj.instructor:
            return obj.instructor.full_name
        if obj.course_offering.tutor:
            return obj.course_offering.tutor.full_name
        return 'Unassigned'

    def get_materials_count(self, obj):
        return obj.materials.count()

    def get_recordings_count(self, obj):
        return obj.recordings.filter(status=RecordingStatus.READY).count()


class VirtualClassDetailSerializer(VirtualClassListSerializer):
    materials = ClassMaterialSerializer(many=True, read_only=True)
    recordings = ClassRecordingSerializer(many=True, read_only=True)
    is_instructor = serializers.SerializerMethodField()
    is_joinable = serializers.BooleanField(read_only=True)

    class Meta(VirtualClassListSerializer.Meta):
        fields = VirtualClassListSerializer.Meta.fields + [
            'materials',
            'recordings',
            'is_instructor',
            'is_joinable',
        ]

    def get_is_instructor(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return request.user.is_staff_role or obj.instructor == request.user


class VirtualClassCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualClass
        fields = [
            'id',
            'course_offering',
            'instructor',
            'title',
            'description',
            'scheduled_start',
            'scheduled_end',
            'recording_enabled',
            'status',
        ]

    def validate(self, attrs):
        start = attrs.get('scheduled_start', getattr(self.instance, 'scheduled_start', None))
        end = attrs.get('scheduled_end', getattr(self.instance, 'scheduled_end', None))
        if start and end and end <= start:
            raise serializers.ValidationError({'scheduled_end': 'End time must be after start time'})
        return attrs


class ClassChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassChatMessage
        fields = [
            'id',
            'virtual_class',
            'sender',
            'sender_name',
            'message_text',
            'created_at',
        ]
        read_only_fields = ['id', 'virtual_class', 'sender', 'created_at']
