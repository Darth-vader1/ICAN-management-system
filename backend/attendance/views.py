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

    @action(detail=False, methods=['get'], permission_classes=[IsStaffOrAbove])
    def marking_sheet(self, request):
        """
        Get or initialize marking sheet for a course offering and date.
        GET /api/attendance/class-sessions/marking_sheet/?course_offering=<uuid>&date=YYYY-MM-DD
        """
        from datetime import datetime
        course_offering_id = request.query_params.get('course_offering')
        session_date_str = request.query_params.get('date')

        from academics.models import CourseOffering
        from enrollments.models import EnrollmentCourse
        from students.models import StudentProfile

        if not course_offering_id:
            # Fallback to first active offering
            first_offering = CourseOffering.objects.filter(is_active=True).first()
            if not first_offering:
                return Response({'error': 'No active course offerings found'}, status=status.HTTP_404_NOT_FOUND)
            course_offering_id = str(first_offering.id)

        try:
            offering = CourseOffering.objects.select_related(
                'course', 'course__level', 'tutor', 'session'
            ).get(id=course_offering_id)
        except CourseOffering.DoesNotExist:
            return Response({'error': 'Course offering not found'}, status=status.HTTP_404_NOT_FOUND)

        if not session_date_str:
            session_date = timezone.now().date()
        else:
            try:
                session_date = datetime.strptime(session_date_str, '%Y-%m-%d').date()
            except ValueError:
                session_date = timezone.now().date()

        # Find or create ClassSession for this date
        class_session = ClassSession.objects.filter(
            course_offering=offering,
            session_date=session_date
        ).first()

        if not class_session:
            class_session = ClassSession.objects.create(
                course_offering=offering,
                instructor=request.user if request.user.is_staff_role else None,
                title=f"{offering.course.name} - {session_date.strftime('%Y-%m-%d')}",
                session_date=session_date,
                start_time="09:00:00",
                end_time="12:00:00",
                status=ClassSession.Status.SCHEDULED
            )

        # Existing records for this session
        existing_records = {
            r.student_id: r.status for r in class_session.attendance_records.all()
        }

        # Enrolled students for this offering
        enrolled_students = StudentProfile.objects.filter(
            enrollments__enrollment_courses__course_offering=offering,
            enrollments__status='active'
        ).select_related('user').distinct().order_by('first_name', 'last_name')

        student_data_list = []
        for student in enrolled_students:
            # Prior attendance history in this course offering
            past_records_list = list(
                AttendanceRecord.objects.filter(
                    student=student,
                    class_session__course_offering=offering
                ).exclude(class_session=class_session).order_by('-class_session__session_date')[:6]
            )

            total_past = len(past_records_list)
            present_past = sum(1 for r in past_records_list if r.status in ['present', 'late'])
            prior_rate = round((present_past / total_past) * 100) if total_past > 0 else 100

            # Prior dots (oldest first)
            prior_dots = [r.status for r in reversed(past_records_list)]

            current_status = existing_records.get(student.id, None)

            initials = f"{(student.first_name or '')[:1]}{(student.last_name or '')[:1]}".upper() or "ST"

            student_data_list.append({
                'id': str(student.id),
                'name': student.full_name,
                'student_code': student.student_code,
                'initials': initials,
                'prior_rate': prior_rate,
                'prior_dots': prior_dots,
                'current_status': current_status
            })

        tutor_name = offering.tutor.full_name if hasattr(offering, 'tutor') and offering.tutor else 'Unassigned'

        return Response({
            'session_id': str(class_session.id),
            'course_offering_id': str(offering.id),
            'course_name': offering.course.name,
            'course_code': offering.course.code,
            'level_name': offering.course.level.name if offering.course and offering.course.level else 'N/A',
            'tutor_name': tutor_name,
            'session_date': session_date.strftime('%Y-%m-%d'),
            'total_students': len(student_data_list),
            'marked_count': len([s for s in student_data_list if s['current_status'] is not None]),
            'students': student_data_list
        })


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
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_attendance(self, request):
        """
        Get attendance records and summary metrics for logged-in student.
        Endpoint: GET /api/attendance/records/my_attendance/
        Permission: Any authenticated user (students access their own records)
        """
        user = request.user
        if not hasattr(user, 'student_profile'):
            return Response(
                {'error': 'No student profile found for current user.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        student = user.student_profile
        records_qs = AttendanceRecord.objects.filter(
            student=student
        ).select_related(
            'class_session__course_offering__course',
            'class_session__course_offering__course__level'
        ).order_by('-class_session__session_date')
        
        course_offering_id = request.query_params.get('course_offering')
        if course_offering_id:
            records_qs = records_qs.filter(class_session__course_offering_id=course_offering_id)
        
        total_count = records_qs.count()
        present_count = records_qs.filter(status=AttendanceRecord.Status.PRESENT).count()
        late_count = records_qs.filter(status=AttendanceRecord.Status.LATE).count()
        absent_count = records_qs.filter(status=AttendanceRecord.Status.ABSENT).count()
        excused_count = records_qs.filter(status=AttendanceRecord.Status.EXCUSED).count()
        
        attended_count = present_count + late_count
        overall_rate = round((attended_count / total_count) * 100) if total_count > 0 else 100

        # Enrolled courses tracked for this student
        from academics.models import CourseOffering
        enrolled_offerings = CourseOffering.objects.filter(
            enrollments__enrollment__student=student,
            enrollments__enrollment__status='active'
        ).distinct()

        courses_tracked = []
        by_course_list = []

        for offering in enrolled_offerings:
            course_name = offering.course.name if offering.course else 'N/A'
            course_code = offering.course.code if offering.course else 'N/A'
            courses_tracked.append(f"{course_code} - {course_name}")

            off_records = records_qs.filter(class_session__course_offering=offering)
            off_tot = off_records.count()
            off_att = off_records.filter(status__in=[AttendanceRecord.Status.PRESENT, AttendanceRecord.Status.LATE]).count()
            off_rate = round((off_att / off_tot) * 100) if off_tot > 0 else 100

            by_course_list.append({
                'offering_id': str(offering.id),
                'course_code': course_code,
                'course_name': course_name,
                'total_sessions': off_tot,
                'attended_sessions': off_att,
                'attendance_rate': off_rate
            })

        records_data = []
        for r in records_qs:
            course = r.class_session.course_offering.course if r.class_session and r.class_session.course_offering else None
            records_data.append({
                'id': str(r.id),
                'session_id': str(r.class_session.id) if r.class_session else None,
                'session_title': r.class_session.title if r.class_session else 'Class Session',
                'session_date': r.class_session.session_date.strftime('%Y-%m-%d') if r.class_session and r.class_session.session_date else None,
                'start_time': str(r.class_session.start_time) if r.class_session and r.class_session.start_time else None,
                'end_time': str(r.class_session.end_time) if r.class_session and r.class_session.end_time else None,
                'course_code': course.code if course else 'N/A',
                'course_name': course.name if course else 'N/A',
                'status': r.status,
                'remarks': r.notes,
                'notes': r.notes,
                'marked_at': r.marked_at.strftime('%Y-%m-%d %H:%M') if r.marked_at else None
            })

        return Response({
            'summary': {
                'overall_rate': overall_rate,
                'total_sessions': total_count,
                'attended_count': attended_count,
                'present_count': present_count,
                'late_count': late_count,
                'absent_count': absent_count,
                'excused_count': excused_count,
                'courses_tracked': courses_tracked,
                'by_course': by_course_list
            },
            'records': records_data
        })
    
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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def overview_summary(self, request):
        """
        Get aggregated attendance dashboard overview statistics.
        GET /api/attendance/records/overview_summary/
        """
        from academics.models import AcademicSession, CourseOffering
        from students.models import StudentProfile
        from enrollments.models import EnrollmentCourse

        active_session = AcademicSession.objects.filter(is_active=True).first()
        session_label = f"{active_session.label} session" if active_session else "2025/2026 session"

        completed_sessions = ClassSession.objects.all()
        classes_held = completed_sessions.count()

        active_offerings = CourseOffering.objects.filter(is_active=True).select_related('course', 'course__level')
        total_courses = active_offerings.count()

        records = AttendanceRecord.objects.all()
        total_slots = records.count()
        present_count = records.filter(status=AttendanceRecord.Status.PRESENT).count()
        late_count = records.filter(status=AttendanceRecord.Status.LATE).count()
        absent_count = records.filter(status=AttendanceRecord.Status.ABSENT).count()
        excused_count = records.filter(status=AttendanceRecord.Status.EXCUSED).count()

        attended_slots = present_count + late_count
        overall_rate = round((attended_slots / total_slots) * 100) if total_slots > 0 else 0

        present_pct = round((present_count / total_slots) * 100) if total_slots > 0 else 0
        late_pct = round((late_count / total_slots) * 100) if total_slots > 0 else 0
        absent_pct = round((absent_count / total_slots) * 100) if total_slots > 0 else 0

        students = StudentProfile.objects.all().select_related('user')
        at_risk_list = []
        at_risk_count = 0
        perfect_count = 0

        for student in students:
            stu_records = records.filter(student=student)
            stu_total = stu_records.count()
            if stu_total == 0:
                continue

            stu_attended = stu_records.filter(status__in=[AttendanceRecord.Status.PRESENT, AttendanceRecord.Status.LATE]).count()
            stu_rate = round((stu_attended / stu_total) * 100)

            if stu_rate == 100:
                perfect_count += 1
            elif stu_rate < 75:
                at_risk_count += 1
                offering_risks = []
                enrolled_offerings = CourseOffering.objects.filter(
                    enrollments__enrollment__student=student,
                    enrollments__enrollment__status='active'
                ).distinct()

                for off in enrolled_offerings:
                    off_records = stu_records.filter(class_session__course_offering=off)
                    off_tot = off_records.count()
                    if off_tot > 0:
                        off_att = off_records.filter(status__in=[AttendanceRecord.Status.PRESENT, AttendanceRecord.Status.LATE]).count()
                        off_rate = round((off_att / off_tot) * 100)
                        offering_risks.append({
                            'code': off.course.code if off.course else 'N/A',
                            'rate': off_rate
                        })

                first_enrollment = student.enrollments.filter(status='active').first()
                level_name = first_enrollment.level.name if first_enrollment and first_enrollment.level else 'N/A'
                initials = f"{(student.first_name or '')[:1]}{(student.last_name or '')[:1]}".upper() or "ST"

                at_risk_list.append({
                    'id': str(student.id),
                    'name': student.full_name,
                    'initials': initials,
                    'level_name': level_name,
                    'overall_rate': stu_rate,
                    'courses_risk': offering_risks
                })

        by_course_list = []
        for off in active_offerings:
            off_sessions = ClassSession.objects.filter(course_offering=off)
            off_classes = off_sessions.count()
            stu_count = EnrollmentCourse.objects.filter(course_offering=off, enrollment__status='active').count()

            off_records = records.filter(class_session__course_offering=off)
            off_tot = off_records.count()
            off_att = off_records.filter(status__in=[AttendanceRecord.Status.PRESENT, AttendanceRecord.Status.LATE]).count()
            off_rate = round((off_att / off_tot) * 100) if off_tot > 0 else 0

            initials = off.course.code[:2].upper() if off.course and off.course.code else "CO"

            by_course_list.append({
                'course_offering_id': str(off.id),
                'course_code': off.course.code if off.course else 'N/A',
                'course_name': off.course.name if off.course else 'N/A',
                'level_name': off.course.level.name if off.course and off.course.level else 'N/A',
                'classes_count': off_classes,
                'student_count': stu_count,
                'attendance_rate': off_rate,
                'initials': initials
            })

        return Response({
            'session_label': session_label,
            'classes_held': classes_held,
            'total_courses': total_courses,
            'overall_rate': overall_rate,
            'total_slots': total_slots,
            'attended_slots': attended_slots,
            'at_risk_count': at_risk_count,
            'perfect_count': perfect_count,
            'session_breakdown': {
                'present_count': present_count,
                'late_count': late_count,
                'absent_count': absent_count,
                'excused_count': excused_count,
                'present_pct': present_pct,
                'late_pct': late_pct,
                'absent_pct': absent_pct,
            },
            'by_course': by_course_list,
            'at_risk_students': at_risk_list
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def student_roster(self, request):
        """
        Get all students attendance summary for the By Student tab.
        GET /api/attendance/records/student_roster/
        """
        from students.models import StudentProfile

        students = StudentProfile.objects.all().select_related('user').order_by('first_name', 'last_name')
        records = AttendanceRecord.objects.all()

        roster = []
        for student in students:
            stu_records = records.filter(student=student).order_by('-class_session__session_date')
            total = stu_records.count()
            attended = stu_records.filter(status__in=[AttendanceRecord.Status.PRESENT, AttendanceRecord.Status.LATE]).count()
            rate = round((attended / total) * 100) if total > 0 else 0

            recent_dots = [r.status for r in reversed(list(stu_records[:8]))]

            first_enrollment = student.enrollments.filter(status='active').first()
            level_name = first_enrollment.level.name if first_enrollment and first_enrollment.level else 'Foundation'

            initials = f"{(student.first_name or '')[:1]}{(student.last_name or '')[:1]}".upper() or "ST"

            roster.append({
                'id': str(student.id),
                'name': student.full_name,
                'student_code': student.student_code,
                'initials': initials,
                'level_name': level_name,
                'attended_count': attended,
                'total_sessions': total,
                'classes_attended_str': f"{attended} / {total} classes" if total > 0 else "0 / 0 classes",
                'prior_dots': recent_dots,
                'prior_rate': rate,
                'status': 'Good' if rate >= 85 else ('Fair' if rate >= 75 else 'At Risk')
            })

        return Response(roster)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def course_detail(self, request):
        """
        Get detailed attendance breakdown for a single course.
        GET /api/attendance/records/course_detail/?course_code=MI or ?course_offering_id=<uuid>
        """
        course_code = request.query_params.get('course_code')
        offering_id = request.query_params.get('course_offering_id')
        
        from academics.models import CourseOffering
        from students.models import StudentProfile
        
        offering = None
        if offering_id:
            offering = CourseOffering.objects.filter(id=offering_id).select_related('course', 'course__level', 'tutor').first()
        elif course_code:
            offering = CourseOffering.objects.filter(course__code__iexact=course_code).select_related('course', 'course__level', 'tutor').first()
        
        if not offering:
            if course_code:
                offering = CourseOffering.objects.filter(course__name__icontains=course_code).select_related('course', 'course__level', 'tutor').first()
            if not offering:
                offering = CourseOffering.objects.select_related('course', 'course__level', 'tutor').first()
        
        if not offering:
            return Response({'error': 'Course offering not found'}, status=404)
        
        sessions = ClassSession.objects.filter(course_offering=offering).order_by('-session_date')
        total_sessions = sessions.count()
        
        enrolled_students = StudentProfile.objects.filter(
            enrollments__enrollment_courses__course_offering=offering,
            enrollments__status='active'
        ).distinct().select_related('user')
        
        total_students = enrolled_students.count()
        
        records = AttendanceRecord.objects.filter(class_session__course_offering=offering)
        total_slots = records.count()
        present_count = records.filter(status=AttendanceRecord.Status.PRESENT).count()
        late_count = records.filter(status=AttendanceRecord.Status.LATE).count()
        absent_count = records.filter(status=AttendanceRecord.Status.ABSENT).count()
        excused_count = records.filter(status=AttendanceRecord.Status.EXCUSED).count()
        
        attended_slots = present_count + late_count
        overall_rate = round((attended_slots / total_slots) * 100) if total_slots > 0 else 100
        
        session_list = []
        for s in sessions:
            s_records = records.filter(class_session=s)
            s_tot = s_records.count()
            s_att = s_records.filter(status__in=[AttendanceRecord.Status.PRESENT, AttendanceRecord.Status.LATE]).count()
            s_rate = round((s_att / s_tot) * 100) if s_tot > 0 else 100
            
            session_list.append({
                'id': str(s.id),
                'title': s.title or f"{offering.course.code} Class",
                'session_date': s.session_date.strftime('%Y-%m-%d') if s.session_date else 'N/A',
                'start_time': str(s.start_time) if s.start_time else 'N/A',
                'end_time': str(s.end_time) if s.end_time else 'N/A',
                'status': s.status,
                'attendance_rate': s.attendance_rate if s.attendance_rate > 0 else s_rate,
                'present_count': s_records.filter(status=AttendanceRecord.Status.PRESENT).count(),
                'late_count': s_records.filter(status=AttendanceRecord.Status.LATE).count(),
                'absent_count': s_records.filter(status=AttendanceRecord.Status.ABSENT).count(),
            })
            
        student_list = []
        for st in enrolled_students:
            st_records = records.filter(student=st)
            st_tot = st_records.count()
            st_att = st_records.filter(status__in=[AttendanceRecord.Status.PRESENT, AttendanceRecord.Status.LATE]).count()
            st_rate = round((st_att / st_tot) * 100) if st_tot > 0 else 100
            
            initials = f"{(st.first_name or '')[:1]}{(st.last_name or '')[:1]}".upper() or "ST"
            
            student_list.append({
                'id': str(st.id),
                'name': st.full_name,
                'student_code': st.student_code,
                'initials': initials,
                'attended_count': st_att,
                'total_sessions': st_tot or total_sessions,
                'attendance_rate': st_rate,
                'status': 'Good Standing' if st_rate >= 75 else 'At Risk'
            })
            
        instructor_name = offering.tutor.full_name if offering.tutor else 'Assigned Tutor'
        level_name = offering.course.level.name if offering.course and offering.course.level else 'Foundation'
        
        return Response({
            'course_offering_id': str(offering.id),
            'course_code': offering.course.code if offering.course else 'N/A',
            'course_name': offering.course.name if offering.course else 'N/A',
            'level_name': level_name,
            'instructor_name': instructor_name,
            'overall_rate': overall_rate,
            'total_sessions': total_sessions,
            'total_students': total_students,
            'present_count': present_count,
            'late_count': late_count,
            'absent_count': absent_count,
            'excused_count': excused_count,
            'sessions': session_list,
            'students': student_list,
        })

