from rest_framework import serializers

from .models import Enrollment, EnrollmentCourse, EnrollmentStatus


class EnrollmentCourseSerializer(serializers.ModelSerializer):
    """Serializer for individual enrollment courses."""

    course_code = serializers.CharField(source='course_offering.course.code', read_only=True)
    course_name = serializers.CharField(source='course_offering.course.name', read_only=True)
    course_duration = serializers.IntegerField(source='course_offering.course.duration', read_only=True)
    tutor_name = serializers.SerializerMethodField()

    class Meta:
        model = EnrollmentCourse
        fields = [
            'id',
            'course_offering',
            'course_code',
            'course_name',
            'course_duration',
            'tutor_name',
            'enrolled_date',
            'dropped',
            'dropped_date',
        ]
        read_only_fields = ['id', 'enrolled_date', 'dropped_date']

    def get_tutor_name(self, obj):
        if obj.course_offering.tutor:
            return f"{obj.course_offering.tutor.first_name} {obj.course_offering.tutor.last_name}"
        return None


class EnrollmentSerializer(serializers.ModelSerializer):
    """Full serializer for enrollment with nested courses."""

    student_name = serializers.SerializerMethodField()
    student_code = serializers.CharField(source='student.student_code', read_only=True)
    student_email = serializers.CharField(source='student.user.email', read_only=True)
    session_label = serializers.CharField(source='session.label', read_only=True)
    level_name = serializers.CharField(source='level.name', read_only=True)
    enrollment_courses = EnrollmentCourseSerializer(many=True, read_only=True)

    # For creating enrollment with courses
    course_offerings = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text="List of course offering IDs to enroll in"
    )

    invoice_id = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'invoice_id',
            'student',
            'student_name',
            'student_code',
            'student_email',
            'session',
            'session_label',
            'level',
            'level_name',
            'status',
            'enrollment_date',
            'approval_date',
            'completion_date',
            'notes',
            'enrollment_courses',
            'course_offerings',  # write-only
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'enrollment_date',
            'approval_date',
            'completion_date',
            'created_at',
            'updated_at',
        ]

    def get_invoice_id(self, obj):
        if hasattr(obj, 'invoice'):
            return str(obj.invoice.id)
        return None

    def get_student_name(self, obj):
        return obj.student.full_name

    def validate_course_offerings(self, value):
        """Ensure course offerings exist and are valid."""
        from academics.models import CourseOffering

        if not value:
            return value

        # Check all offerings exist
        offerings = CourseOffering.objects.filter(id__in=value)
        if offerings.count() != len(value):
            raise serializers.ValidationError("One or more course offerings not found")

        return value

    def create(self, validated_data):
        """Create enrollment with selected courses."""
        from academics.models import CourseOffering

        course_offering_ids = validated_data.pop('course_offerings', [])

        # Create enrollment
        enrollment = Enrollment.objects.create(**validated_data)

        # Create enrollment courses
        if course_offering_ids:
            offerings = CourseOffering.objects.filter(id__in=course_offering_ids)
            for offering in offerings:
                EnrollmentCourse.objects.create(
                    enrollment=enrollment,
                    course_offering=offering
                )

        return enrollment

    def update(self, instance, validated_data):
        """Update enrollment (course_offerings handled separately)."""
        validated_data.pop('course_offerings', None)  # Can't update courses here
        return super().update(instance, validated_data)


class EnrollmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing enrollments in staff dashboard."""

    student_name = serializers.SerializerMethodField()
    student_code = serializers.CharField(source='student.student_code', read_only=True)
    session_label = serializers.CharField(source='session.label', read_only=True)
    level_name = serializers.CharField(source='level.name', read_only=True)
    course_count = serializers.SerializerMethodField()
    courses = serializers.SerializerMethodField()
    invoice_id = serializers.SerializerMethodField()
    invoice_number = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'student_code',
            'student_name',
            'session_label',
            'level_name',
            'status',
            'enrollment_date',
            'course_count',
            'courses',
            'invoice_id',
            'invoice_number',
            'payment_status',
        ]

    def get_student_name(self, obj):
        return obj.student.full_name

    def get_course_count(self, obj):
        return obj.enrollment_courses.filter(dropped=False).count()

    def get_courses(self, obj):
        return list(
            obj.enrollment_courses.filter(dropped=False).values_list('course_offering__course__code', flat=True)
        )

    def get_invoice_id(self, obj):
        if hasattr(obj, 'invoice') and obj.invoice:
            return str(obj.invoice.id)
        return None

    def get_invoice_number(self, obj):
        if hasattr(obj, 'invoice') and obj.invoice:
            return obj.invoice.invoice_number
        return None

    def get_payment_status(self, obj):
        if hasattr(obj, 'invoice') and obj.invoice:
            return obj.invoice.status
        return 'unpaid'


class EnrollmentCreateSerializer(serializers.Serializer):
    """Specialized serializer for student self-enrollment."""

    session = serializers.UUIDField(help_text="Academic session ID")
    level = serializers.UUIDField(help_text="Level ID")
    course_offerings = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="List of course offering IDs (at least 1 required)"
    )

    def validate(self, data):
        """Validate enrollment creation data."""
        from academics.models import AcademicSession, Level, CourseOffering
        
        errors = {}

        # Validate session
        try:
            session = AcademicSession.objects.get(id=data['session'])
            if not session.is_active:
                errors['session'] = f"Session {session.label} is not active"
            data['session_obj'] = session
        except AcademicSession.DoesNotExist:
            errors['session'] = "Session not found"

        # Validate level
        try:
            level = Level.objects.get(id=data['level'])
            if not level.is_active:
                errors['level'] = f"Level {level.name} is not active"
            data['level_obj'] = level
        except Level.DoesNotExist:
            errors['level'] = "Level not found"

        # Validate course offerings
        if 'course_offerings' in data:
            offerings = CourseOffering.objects.filter(
                id__in=data['course_offerings']
            ).select_related('course', 'course__level', 'session')

            if offerings.count() != len(data['course_offerings']):
                errors['course_offerings'] = "One or more course offerings not found"
            else:
                # Check all offerings are for the correct session and level
                session_obj = data.get('session_obj')
                level_obj = data.get('level_obj')

                if session_obj and level_obj:
                    for offering in offerings:
                        if offering.session != session_obj:
                            errors['course_offerings'] = (
                                f"Course {offering.course.code} is not offered in selected session"
                            )
                            break
                        if offering.course.level != level_obj:
                            errors['course_offerings'] = (
                                f"Course {offering.course.code} does not belong to selected level"
                            )
                            break
                        if not offering.is_active:
                            errors['course_offerings'] = (
                                f"Course {offering.course.code} offering is not active"
                            )
                            break

                data['offerings_obj'] = offerings

        if errors:
            raise serializers.ValidationError(errors)

        return data


class AddCourseSerializer(serializers.Serializer):
    """Serializer for adding a course to existing enrollment."""

    course_offering = serializers.UUIDField(help_text="Course offering ID to add")

    def validate_course_offering(self, value):
        """Ensure course offering exists and is valid."""
        from academics.models import CourseOffering

        try:
            offering = CourseOffering.objects.get(id=value)
            if not offering.is_active:
                raise serializers.ValidationError("Course offering is not active")
            return offering
        except CourseOffering.DoesNotExist:
            raise serializers.ValidationError("Course offering not found")
