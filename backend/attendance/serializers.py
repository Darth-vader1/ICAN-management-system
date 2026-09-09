from rest_framework import serializers
from django.utils import timezone

from .models import ClassSession, AttendanceRecord
from students.serializers import StudentProfileSerializer


class ClassSessionSerializer(serializers.ModelSerializer):
    """Serializer for class sessions"""
    
    course_code = serializers.CharField(source='course_offering.course.code', read_only=True)
    course_name = serializers.CharField(source='course_offering.course.name', read_only=True)
    session_label = serializers.CharField(source='course_offering.session.label', read_only=True)
    instructor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    is_past = serializers.BooleanField(read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    attendance_rate = serializers.FloatField(read_only=True)
    
    total_students = serializers.SerializerMethodField()
    present_count = serializers.SerializerMethodField()
    absent_count = serializers.SerializerMethodField()
    late_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ClassSession
        fields = [
            'id',
            'course_offering',
            'course_code',
            'course_name',
            'session_label',
            'instructor',
            'instructor_name',
            'title',
            'description',
            'session_date',
            'start_time',
            'end_time',
            'location',
            'status',
            'status_display',
            'is_past',
            'duration_minutes',
            'attendance_rate',
            'total_students',
            'present_count',
            'absent_count',
            'late_count',
            'attendance_marked_at',
            'attendance_marked_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'is_past',
            'duration_minutes',
            'attendance_rate',
            'attendance_marked_at',
            'attendance_marked_by',
            'created_at',
            'updated_at',
        ]
    
    def get_instructor_name(self, obj):
        """Get instructor full name"""
        if obj.instructor and hasattr(obj.instructor, 'staff_profile'):
            return obj.instructor.staff_profile.full_name
        return None
    
    def get_total_students(self, obj):
        """Get total number of enrolled students"""
        return obj.attendance_records.count()
    
    def get_present_count(self, obj):
        """Get count of present students"""
        return obj.attendance_records.filter(status=AttendanceRecord.Status.PRESENT).count()
    
    def get_absent_count(self, obj):
        """Get count of absent students"""
        return obj.attendance_records.filter(status=AttendanceRecord.Status.ABSENT).count()
    
    def get_late_count(self, obj):
        """Get count of late students"""
        return obj.attendance_records.filter(status=AttendanceRecord.Status.LATE).count()
    
    def validate(self, data):
        """Validate session data"""
        if 'start_time' in data and 'end_time' in data:
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError({
                    'end_time': 'End time must be after start time'
                })
        
        return data


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for attendance records"""
    
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id_number = serializers.CharField(source='student.student_id', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    marked_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id',
            'class_session',
            'student',
            'student_name',
            'student_id_number',
            'status',
            'status_display',
            'marked_at',
            'marked_by',
            'marked_by_name',
            'notes',
            'arrival_time',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'marked_at',
            'marked_by',
            'created_at',
            'updated_at',
        ]
    
    def get_marked_by_name(self, obj):
        """Get name of person who marked attendance"""
        if obj.marked_by and hasattr(obj.marked_by, 'staff_profile'):
            return obj.marked_by.staff_profile.full_name
        return None
    
    def validate(self, data):
        """Validate attendance record"""
        # Check if student is enrolled
        from enrollments.models import EnrollmentCourse
        
        class_session = data.get('class_session')
        student = data.get('student')
        
        if class_session and student:
            enrolled = EnrollmentCourse.objects.filter(
                enrollment__student=student,
                course_offering=class_session.course_offering,
                enrollment__status='active'
            ).exists()
            
            if not enrolled:
                raise serializers.ValidationError({
                    'student': f'{student.full_name} is not enrolled in this course'
                })
        
        return data


class AttendanceRecordBulkSerializer(serializers.Serializer):
    """Serializer for bulk attendance marking"""
    
    class_session = serializers.PrimaryKeyRelatedField(
        queryset=ClassSession.objects.all()
    )
    records = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of {student_id, status, notes?, arrival_time?}"
    )
    
    def validate_records(self, value):
        """Validate records structure"""
        for record in value:
            if 'student' not in record:
                raise serializers.ValidationError("Each record must have 'student' field")
            if 'status' not in record:
                raise serializers.ValidationError("Each record must have 'status' field")
            
            # Validate status
            if record['status'] not in dict(AttendanceRecord.Status.choices):
                raise serializers.ValidationError(f"Invalid status: {record['status']}")
        
        return value


class StudentAttendanceSummarySerializer(serializers.Serializer):
    """Serializer for student attendance summary"""
    
    student_id = serializers.CharField()
    student_name = serializers.CharField()
    student_id_number = serializers.CharField()
    total_sessions = serializers.IntegerField()
    present_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    late_count = serializers.IntegerField()
    excused_count = serializers.IntegerField()
    attendance_rate = serializers.FloatField()


class CourseAttendanceStatsSerializer(serializers.Serializer):
    """Serializer for course attendance statistics"""
    
    course_offering_id = serializers.CharField()
    course_code = serializers.CharField()
    course_name = serializers.CharField()
    total_sessions = serializers.IntegerField()
    total_students = serializers.IntegerField()
    average_attendance_rate = serializers.FloatField()
    sessions_completed = serializers.IntegerField()
