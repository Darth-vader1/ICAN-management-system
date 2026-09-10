from django.db.models import Count, Q, Avg
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsStaffOrAbove
from .models import ClassSession, AttendanceRecord
from .serializers import (
    ClassSessionSerializer,
    AttendanceRecordSerializer,
    AttendanceRecordBulkSerializer,
    StudentAttendanceSummarySerializer,
    CourseAttendanceStatsSerializer,
)


class ClassSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for class sessions.
    Staff can create/update sessions, students can view their sessions.
    """
    
    serializer_class = ClassSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ClassSession.objects.select_related(
            'course_offering__course',
            'course_offering__session',
            'instructor'
        ).prefetch_related('attendance_records')
        
        # Staff can see all sessions
        if user.is_staff_role:
            # Filter by instructor if specified
            instructor_id = self.request.query_params.get('instructor')
            if instructor_id:
                queryset = queryset.filter(instructor_id=instructor_id)
            
            # Filter by date range
            start_date = self.request.query_params.get('start_date')
            end_date = self.request.query_params.get('end_date')
            if start_date:
                queryset = queryset.filter(session_date__gte=start_date)
            if end_date:
                queryset = queryset.filter(session_date__lte=end_date)
            
            # Filter by status
            status_filter = self.request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            return queryset
        
        # Students see only sessions for their enrolled courses
        from enrollments.models import EnrollmentCourse
        
        enrolled_offerings = EnrollmentCourse.objects.filter(
            enrollment__student__user=user,
            enrollment__status='active'
        ).values_list('course_offering_id', flat=True)
        
        return queryset.filter(course_offering_id__in=enrolled_offerings)
    
    def perform_create(self, serializer):
        """Set instructor to current user if not specified"""
        if not serializer.validated_data.get('instructor'):
            serializer.save(instructor=self.request.user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrAbove])
    def mark_attendance(self, request, pk=None):
        """
        Bulk mark attendance for a session.
        
        POST /api/attendance/class-sessions/{id}/mark_attendance/
        Body: {
            "records": [
                {"student": "uuid", "status": "present"},
                {"student": "uuid", "status": "late", "arrival_time": "09:15:00", "notes": "Traffic"},
                {"student": "uuid", "status": "absent", "notes": "Sick"}
            ]
        }
        """
        class_session = self.get_object()
        records_data = request.data.get('records', [])
        
        if not records_data:
            return Response(
                {'error': 'No attendance records provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_records = []
        updated_records = []
        errors = []
        
        for record_data in records_data:
            try:
                student_id = record_data.get('student')
                attendance_status = record_data.get('status')
                notes = record_data.get('notes', '')
                arrival_time = record_data.get('arrival_time')
                
                if not student_id or not attendance_status:
                    errors.append({'student': student_id, 'error': 'Missing required fields'})
                    continue
                
                # Create or update attendance record
                attendance, created = AttendanceRecord.objects.update_or_create(
                    class_session=class_session,
                    student_id=student_id,
                    defaults={
                        'status': attendance_status,
                        'notes': notes,
                        'arrival_time': arrival_time,
                        'marked_by': request.user,
                    }
                )
                
                if created:
                    created_records.append(AttendanceRecordSerializer(attendance).data)
                else:
                    updated_records.append(AttendanceRecordSerializer(attendance).data)
            
            except Exception as e:
                errors.append({'student': student_id, 'error': str(e)})
        
        # Update session metadata
        if created_records or updated_records:
            class_session.attendance_marked_at = timezone.now()
            class_session.attendance_marked_by = request.user
            if class_session.status == ClassSession.Status.SCHEDULED:
                class_session.status = ClassSession.Status.COMPLETED
            class_session.save()
        
        return Response({
            'created': len(created_records),
            'updated': len(updated_records),
            'errors': errors,
            'created_records': created_records,
            'updated_records': updated_records,
        })
    
    @action(detail=True, methods=['get'])
    def attendance_list(self, request, pk=None):
        """Get attendance records for a session"""
        class_session = self.get_object()
        records = class_session.attendance_records.select_related('student__user', 'marked_by')
        serializer = AttendanceRecordSerializer(records, many=True)
        
        return Response(serializer.data)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for individual attendance records.
    Staff can CRUD, students can view their own.
    """
    
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = AttendanceRecord.objects.select_related(
            'class_session__course_offering__course',
            'student__user',
            'marked_by'
        )
        
        # Staff can see all records
        if user.is_staff_role:
            # Filter by student
            student_id = self.request.query_params.get('student')
            if student_id:
                queryset = queryset.filter(student_id=student_id)
            
            # Filter by session
            session_id = self.request.query_params.get('class_session')
            if session_id:
                queryset = queryset.filter(class_session_id=session_id)
            
            # Filter by status
            status_filter = self.request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            return queryset
        
        # Students see only their own records
        if hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        
        return queryset.none()
    
    def perform_create(self, serializer):
        """Set marked_by to current user"""
        serializer.save(marked_by=self.request.user)
    
    def perform_update(self, serializer):
        """Update marked_by on change"""
        serializer.save(marked_by=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[])
    def my_attendance(self, request):
        """
        Get attendance records for logged-in student.
        Endpoint: GET /api/attendance/records/my_attendance/
        Permission: Any authenticated user (students access their own records)
        """
        if not hasattr(request.user, 'student_profile'):
            return Response(
                {'error': 'Only students can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        records = AttendanceRecord.objects.filter(
            student=request.user.student_profile
        ).select_related(
            'class_session__course_offering__course'
        ).order_by('-class_session__session_date')
        
        # Filter by course if specified
        course_offering_id = request.query_params.get('course_offering')
        if course_offering_id:
            records = records.filter(class_session__course_offering_id=course_offering_id)
        
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsStaffOrAbove])
    def student_summary(self, request):
        """
        Get attendance summary for all students in a course.
        
        GET /api/attendance/records/student_summary/?course_offering=<uuid>
        """
        course_offering_id = request.query_params.get('course_offering')
        
        if not course_offering_id:
            return Response(
                {'error': 'course_offering parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all sessions for this course
        sessions = ClassSession.objects.filter(course_offering_id=course_offering_id)
        total_sessions = sessions.count()
        
        # Get enrolled students
        from enrollments.models import EnrollmentCourse
        from students.models import StudentProfile
        
        enrolled_students = StudentProfile.objects.filter(
            enrollments__enrollment_courses__course_offering_id=course_offering_id,
            enrollments__status='active'
        ).distinct()
        
        summaries = []
        for student in enrolled_students:
            # Get attendance records for this student
            records = AttendanceRecord.objects.filter(
                student=student,
                class_session__course_offering_id=course_offering_id
            )
            
            present_count = records.filter(status=AttendanceRecord.Status.PRESENT).count()
            absent_count = records.filter(status=AttendanceRecord.Status.ABSENT).count()
            late_count = records.filter(status=AttendanceRecord.Status.LATE).count()
            excused_count = records.filter(status=AttendanceRecord.Status.EXCUSED).count()
            
            # Calculate attendance rate (present + late / total sessions)
            if total_sessions > 0:
                attendance_rate = round(((present_count + late_count) / total_sessions) * 100, 2)
            else:
                attendance_rate = 0
            
            summaries.append({
                'student_id': str(student.id),
                'student_name': student.full_name,
                'student_id_number': student.student_id,
                'total_sessions': total_sessions,
                'present_count': present_count,
                'absent_count': absent_count,
                'late_count': late_count,
                'excused_count': excused_count,
                'attendance_rate': attendance_rate,
            })
        
        serializer = StudentAttendanceSummarySerializer(summaries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsStaffOrAbove])
    def course_stats(self, request):
        """
        Get attendance statistics for all courses.
        
        GET /api/attendance/records/course_stats/
        """
        from academics.models import CourseOffering
        
        # Get all active course offerings
        course_offerings = CourseOffering.objects.select_related('course', 'session')
        
        stats = []
        for offering in course_offerings:
            sessions = ClassSession.objects.filter(course_offering=offering)
            total_sessions = sessions.count()
            
            if total_sessions == 0:
                continue
            
            # Count enrolled students
            from enrollments.models import EnrollmentCourse
            total_students = EnrollmentCourse.objects.filter(
                course_offering=offering,
                enrollment__status='active'
            ).count()
            
            # Calculate average attendance rate
            sessions_completed = sessions.filter(
                status=ClassSession.Status.COMPLETED
            ).count()
            
            avg_rate = 0
            if sessions_completed > 0:
                rates = [session.attendance_rate for session in sessions if session.attendance_rate > 0]
                if rates:
                    avg_rate = round(sum(rates) / len(rates), 2)
            
            stats.append({
                'course_offering_id': str(offering.id),
                'course_code': offering.course.code,
                'course_name': offering.course.name,
                'total_sessions': total_sessions,
                'total_students': total_students,
                'average_attendance_rate': avg_rate,
                'sessions_completed': sessions_completed,
            })
        
        serializer = CourseAttendanceStatsSerializer(stats, many=True)
        return Response(serializer.data)
