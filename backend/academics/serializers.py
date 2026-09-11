from rest_framework import serializers

from .models import AcademicSession, Class, ClassSchedule, Course, CourseOffering, Level, ScheduleTemplate


class LevelSerializer(serializers.ModelSerializer):
    """Serializer for Level model."""

    class Meta:
        model = Level
        fields = [
            'id',
            'name',
            'code',
            'order',
            'description',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AcademicSessionSerializer(serializers.ModelSerializer):
    """Serializer for AcademicSession model."""

    class Meta:
        model = AcademicSession
        fields = [
            'id',
            'label',
            'start_date',
            'end_date',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Ensure end_date is after start_date."""
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date.'
                })
        return data


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model."""

    level_name = serializers.CharField(source='level.name', read_only=True)
    level_code = serializers.CharField(source='level.code', read_only=True)
    tutor_name = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id',
            'level',
            'level_name',
            'level_code',
            'name',
            'code',
            'description',
            'duration',
            'price',
            'tutor_name',
            'enrolled_count',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tutor_name(self, obj):
        offering = obj.offerings.filter(session__is_active=True, is_active=True).select_related('tutor').first()
        if offering and offering.tutor:
            return f"{offering.tutor.first_name} {offering.tutor.last_name}".strip()
        return "Unassigned"

    def get_enrolled_count(self, obj):
        from enrollments.models import EnrollmentCourse
        return EnrollmentCourse.objects.filter(
            course_offering__course=obj,
            course_offering__session__is_active=True,
            enrollment__status='active',
            dropped=False
        ).count()


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing courses."""

    level_name = serializers.CharField(source='level.name', read_only=True)
    level_code = serializers.CharField(source='level.code', read_only=True)
    tutor_name = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id',
            'code',
            'name',
            'description',
            'level',
            'level_name',
            'level_code',
            'price',
            'tutor_name',
            'enrolled_count',
            'is_active',
        ]

    def get_tutor_name(self, obj):
        offering = obj.offerings.filter(session__is_active=True, is_active=True).select_related('tutor').first()
        if offering and offering.tutor:
            return f"{offering.tutor.first_name} {offering.tutor.last_name}".strip()
        return "Unassigned"

    def get_enrolled_count(self, obj):
        from enrollments.models import EnrollmentCourse
        return EnrollmentCourse.objects.filter(
            course_offering__course=obj,
            course_offering__session__is_active=True,
            enrollment__status='active',
            dropped=False
        ).count()


class CourseOfferingSerializer(serializers.ModelSerializer):
    """Serializer for CourseOffering model."""

    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    session_label = serializers.CharField(source='session.label', read_only=True)
    tutor_name = serializers.SerializerMethodField()
    level_name = serializers.CharField(source='course.level.name', read_only=True)

    class Meta:
        model = CourseOffering
        fields = [
            'id',
            'course',
            'course_name',
            'course_code',
            'session',
            'session_label',
            'tutor',
            'tutor_name',
            'level_name',
            'capacity',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tutor_name(self, obj):
        if obj.tutor:
            return f"{obj.tutor.first_name} {obj.tutor.last_name}"
        return None


class CourseOfferingListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing course offerings."""

    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_price = serializers.DecimalField(source='course.price', max_digits=10, decimal_places=2, read_only=True)
    session_label = serializers.CharField(source='session.label', read_only=True)
    level_name = serializers.CharField(source='course.level.name', read_only=True)
    level_id = serializers.UUIDField(source='course.level.id', read_only=True)
    level_code = serializers.CharField(source='course.level.code', read_only=True)

    class Meta:
        model = CourseOffering
        fields = [
            'id',
            'course_code',
            'course_name',
            'course_price',
            'session_label',
            'level_name',
            'level_id',
            'level_code',
            'is_active',
        ]


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for Class model."""

    course_offering_display = serializers.CharField(
        source='course_offering.__str__',
        read_only=True
    )
    tutor_name = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course_offering.course.name', read_only=True)
    session_label = serializers.CharField(source='course_offering.session.label', read_only=True)

    class Meta:
        model = Class
        fields = [
            'id',
            'course_offering',
            'course_offering_display',
            'course_name',
            'session_label',
            'name',
            'tutor',
            'tutor_name',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tutor_name(self, obj):
        if obj.tutor:
            return f"{obj.tutor.first_name} {obj.tutor.last_name}"
        return None


class ClassScheduleSerializer(serializers.ModelSerializer):
    """Serializer for ClassSchedule model."""

    class_name = serializers.CharField(source='class_instance.name', read_only=True)
    course_name = serializers.CharField(
        source='class_instance.course_offering.course.name',
        read_only=True
    )
    course_code = serializers.CharField(
        source='class_instance.course_offering.course.code',
        read_only=True
    )
    level_code = serializers.CharField(
        source='class_instance.course_offering.course.level.code',
        read_only=True
    )
    level_name = serializers.CharField(
        source='class_instance.course_offering.course.level.name',
        read_only=True
    )
    tutor_name = serializers.SerializerMethodField()

    class Meta:
        model = ClassSchedule
        fields = [
            'id',
            'class_instance',
            'class_name',
            'course_name',
            'course_code',
            'level_code',
            'level_name',
            'tutor_name',
            'date',
            'start_time',
            'end_time',
            'location',
            'meeting_url',
            'notes',
            'is_cancelled',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tutor_name(self, obj):
        if obj.class_instance and obj.class_instance.tutor:
            return f"{obj.class_instance.tutor.first_name} {obj.class_instance.tutor.last_name}"
        if obj.class_instance and obj.class_instance.course_offering and obj.class_instance.course_offering.tutor:
            return f"{obj.class_instance.course_offering.tutor.first_name} {obj.class_instance.course_offering.tutor.last_name}"
        return "TBA"

    def validate(self, data):
        """Ensure end_time is after start_time."""
        if data.get('end_time') and data.get('start_time'):
            if data['end_time'] <= data['start_time']:
                raise serializers.ValidationError({
                    'end_time': 'End time must be after start time.'
                })
        return data


class ClassScheduleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing class schedules."""

    class_name = serializers.CharField(source='class_instance.name', read_only=True)
    course_name = serializers.CharField(
        source='class_instance.course_offering.course.name',
        read_only=True
    )
    course_code = serializers.CharField(
        source='class_instance.course_offering.course.code',
        read_only=True
    )
    level_code = serializers.CharField(
        source='class_instance.course_offering.course.level.code',
        read_only=True
    )
    level_name = serializers.CharField(
        source='class_instance.course_offering.course.level.name',
        read_only=True
    )
    tutor_name = serializers.SerializerMethodField()

    class Meta:
        model = ClassSchedule
        fields = [
            'id',
            'class_name',
            'course_name',
            'course_code',
            'level_code',
            'level_name',
            'tutor_name',
            'date',
            'start_time',
            'end_time',
            'location',
            'is_cancelled',
        ]

    def get_tutor_name(self, obj):
        if obj.class_instance and obj.class_instance.tutor:
            return f"{obj.class_instance.tutor.first_name} {obj.class_instance.tutor.last_name}"
        if obj.class_instance and obj.class_instance.course_offering and obj.class_instance.course_offering.tutor:
            return f"{obj.class_instance.course_offering.tutor.first_name} {obj.class_instance.course_offering.tutor.last_name}"
        return "TBA"


class ScheduleTemplateSerializer(serializers.ModelSerializer):
    """Serializer for recurring schedule templates."""

    class Meta:
        model = ScheduleTemplate
        fields = [
            'id',
            'course',
            'course_code',
            'course_name',
            'level_code',
            'day_of_week',
            'frequency',
            'start_time',
            'end_time',
            'tutor_name',
            'room',
            'status',
            'status_subtext',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

