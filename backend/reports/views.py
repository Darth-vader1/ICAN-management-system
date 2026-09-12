"""
Views for report generation and export
"""
from datetime import datetime, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db.models import Sum, Count, Q, Avg, F
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsStaffOrAbove, IsFinanceOrAbove
from billing.models import Invoice, Payment, FeeStructure
from students.models import StudentProfile
from enrollments.models import Enrollment
from attendance.models import ClassSession, AttendanceRecord
from academics.models import CourseOffering

from .utils import export_to_csv, export_to_excel, export_to_pdf


@api_view(['GET'])
@permission_classes([IsFinanceOrAbove])
def financial_summary_report(request):
    """
    Financial summary report with revenue, payments, and outstanding balances
    
    GET /api/reports/financial-summary/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&format=json
    Formats: json, csv, excel, pdf
    """
    # Get date range
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    export_format = request.query_params.get('export_format') or request.query_params.get('export') or request.query_params.get('format', 'json')
    
    # Filter invoices by creation date; the current Invoice model stores this in created_at.
    invoices = Invoice.objects.all()
    if start_date:
        invoices = invoices.filter(created_at__date__gte=start_date)
    if end_date:
        invoices = invoices.filter(created_at__date__lte=end_date)
    
    # Calculate totals
    total_invoiced = invoices.aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0')
    
    total_paid = invoices.aggregate(
        paid=Sum('amount_paid')
    )['paid'] or Decimal('0')
    
    total_outstanding = total_invoiced - total_paid
    
    # Payment method breakdown
    payments = Payment.objects.filter(status='successful')
    if start_date:
        payments = payments.filter(transaction_date__date__gte=start_date)
    if end_date:
        payments = payments.filter(transaction_date__date__lte=end_date)
    
    payment_by_method = payments.values('method').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('-total')
    
    # Invoice status breakdown
    invoice_status = invoices.values('status').annotate(
        count=Count('id'),
        total=Sum('total_amount')
    ).order_by('status')
    
    summary = {
        'period': {
            'start_date': start_date or 'All time',
            'end_date': end_date or 'Present',
        },
        'overview': {
            'total_invoiced': float(total_invoiced),
            'total_paid': float(total_paid),
            'total_outstanding': float(total_outstanding),
            'collection_rate': float((total_paid / total_invoiced * 100) if total_invoiced > 0 else 0),
        },
        'payment_methods': list(payment_by_method),
        'invoice_status': list(invoice_status),
    }
    
    # Export handling
    if export_format != 'json':
        data = [
            {
                'Metric': 'Total Invoiced',
                'Amount': float(total_invoiced),
            },
            {
                'Metric': 'Total Paid',
                'Amount': float(total_paid),
            },
            {
                'Metric': 'Total Outstanding',
                'Amount': float(total_outstanding),
            },
        ]
        
        filename = f'financial_summary_{datetime.now().strftime("%Y%m%d")}'
        title = 'Financial Summary Report'
        
        if export_format == 'csv':
            return export_to_csv(data, f'{filename}.csv')
        elif export_format == 'excel':
            return export_to_excel(data, f'{filename}.xlsx', title=title)
        elif export_format == 'pdf':
            return export_to_pdf(data, f'{filename}.pdf', title=title)
    
    return Response(summary)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_report(request):
    """
    Detailed student report with enrollment, attendance, and payment info
    
    GET /api/reports/students/?student_id=UUID&format=json
    Formats: json, csv, excel, pdf
    """
    student_id = request.query_params.get('student_id')
    export_format = request.query_params.get('export_format') or request.query_params.get('export') or request.query_params.get('format', 'json')
    
    if not student_id:
        return Response(
            {'error': 'student_id parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Ownership check for students
    if not request.user.is_staff_role:
        if not hasattr(request.user, 'student_profile') or str(request.user.student_profile.id) != str(student_id):
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    try:
        student = StudentProfile.objects.select_related('user').get(id=student_id)
    except (StudentProfile.DoesNotExist, ValueError, ValidationError):
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get enrollments
    enrollments = Enrollment.objects.filter(student=student).select_related(
        'session', 'level'
    ).prefetch_related('enrollment_courses__course_offering__course')
    
    # Get invoices
    invoices = Invoice.objects.filter(student=student).select_related('enrollment')
    
    # Get attendance
    attendance_records = AttendanceRecord.objects.filter(student=student).select_related(
        'class_session__course_offering__course'
    )
    
    total_sessions = attendance_records.count()
    present_count = attendance_records.filter(status='present').count()
    late_count = attendance_records.filter(status='late').count()
    absent_count = attendance_records.filter(status='absent').count()
    
    attendance_rate = ((present_count + late_count) / total_sessions * 100) if total_sessions > 0 else 0
    
    # Financial summary
    total_invoiced = invoices.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
    total_paid = invoices.aggregate(paid=Sum('amount_paid'))['paid'] or Decimal('0')
    balance = total_invoiced - total_paid
    
    report = {
        'student': {
            'id': str(student.id),
            'name': student.full_name,
            'student_id': student.student_id,
            'email': student.user.email if student.user else '',
            'phone': getattr(student, 'whatsapp_number', ''),
        },
        'enrollments': {
            'total': enrollments.count(),
            'active': enrollments.filter(status='active').count(),
            'details': [
                {
                    'session': e.session.label if e.session else '',
                    'level': e.level.name if e.level else '',
                    'status': e.status,
                    'courses': [
                        ec.course_offering.course.name 
                        for ec in e.enrollment_courses.all() 
                        if ec.course_offering and ec.course_offering.course
                    ]
                }
                for e in enrollments
            ]
        },
        'attendance': {
            'total_sessions': total_sessions,
            'present': present_count,
            'late': late_count,
            'absent': absent_count,
            'attendance_rate': round(attendance_rate, 2),
        },
        'financial': {
            'total_invoiced': float(total_invoiced),
            'total_paid': float(total_paid),
            'balance': float(balance),
        }
    }
    
    # Export handling
    if export_format != 'json':
        data = [
            {
                'Student ID': student.student_id,
                'Name': student.full_name,
                'Email': student.user.email if (hasattr(student, 'user') and student.user) else '',
                'Total Sessions': total_sessions,
                'Present': present_count,
                'Absent': absent_count,
                'Attendance Rate': f'{attendance_rate:.1f}%',
                'Total Invoiced': float(total_invoiced),
                'Total Paid': float(total_paid),
                'Balance': float(balance),
            }
        ]
        
        filename = f'student_report_{student.student_id}_{datetime.now().strftime("%Y%m%d")}'
        title = f'Student Report: {student.full_name}'
        
        if export_format == 'csv':
            return export_to_csv(data, f'{filename}.csv')
        elif export_format == 'excel':
            return export_to_excel(data, f'{filename}.xlsx', title=title)
        elif export_format == 'pdf':
            return export_to_pdf(data, f'{filename}.pdf', title=title)
    
    return Response(report)


@api_view(['GET'])
@permission_classes([IsStaffOrAbove])
def attendance_report(request):
    """
    Detailed attendance report by course or session
    
    GET /api/reports/attendance/?course_offering=UUID&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&format=json
    Formats: json, csv, excel, pdf
    """
    course_offering_id = request.query_params.get('course_offering')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    export_format = request.query_params.get('export_format') or request.query_params.get('export') or request.query_params.get('format', 'json')
    
    # Filter sessions
    sessions = ClassSession.objects.select_related(
        'course_offering__course', 'instructor'
    ).prefetch_related('attendance_records')
    
    if course_offering_id:
        sessions = sessions.filter(course_offering_id=course_offering_id)
    if start_date:
        sessions = sessions.filter(session_date__gte=start_date)
    if end_date:
        sessions = sessions.filter(session_date__lte=end_date)
    
    # Calculate statistics
    total_sessions = sessions.count()
    completed_sessions = sessions.filter(status='completed').count()
    
    # Average attendance rate
    rates = [s.attendance_rate for s in sessions if s.attendance_rate > 0]
    avg_attendance_rate = sum(rates) / len(rates) if rates else 0
    
    # Session details
    session_details = []
    for session in sessions[:100]:  # Limit to 100 for performance
        session_details.append({
            'date': session.session_date.strftime('%Y-%m-%d'),
            'course': session.course_offering.course.code,
            'title': session.title,
            'status': session.status,
            'total_students': session.total_students,
            'present': session.present_count,
            'absent': session.absent_count,
            'late': session.late_count,
            'attendance_rate': round(session.attendance_rate, 2),
        })
    
    report = {
        'period': {
            'start_date': start_date or 'All time',
            'end_date': end_date or 'Present',
        },
        'summary': {
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'average_attendance_rate': round(avg_attendance_rate, 2),
        },
        'sessions': session_details,
    }
    
    # Export handling
    if export_format != 'json':
        filename = f'attendance_report_{datetime.now().strftime("%Y%m%d")}'
        title = 'Attendance Report'
        
        if export_format == 'csv':
            return export_to_csv(session_details, f'{filename}.csv')
        elif export_format == 'excel':
            return export_to_excel(session_details, f'{filename}.xlsx', title=title)
        elif export_format == 'pdf':
            return export_to_pdf(session_details, f'{filename}.pdf', title=title)
    
    return Response(report)


@api_view(['GET'])
@permission_classes([IsFinanceOrAbove])
def payment_report(request):
    """
    Detailed payment report with transactions
    
    GET /api/reports/payments/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&method=PAYMENT_METHOD&format=json
    Formats: json, csv, excel, pdf
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    method = request.query_params.get('method')
    export_format = request.query_params.get('export_format') or request.query_params.get('export') or request.query_params.get('format', 'json')
    
    # Filter payments
    payments = Payment.objects.filter(status='successful').select_related(
        'student__user', 'invoice'
    )
    
    if start_date:
        payments = payments.filter(transaction_date__date__gte=start_date)
    if end_date:
        payments = payments.filter(transaction_date__date__lte=end_date)
    if method:
        payments = payments.filter(method=method)
    
    # Calculate totals
    total_amount = payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')
    total_count = payments.count()
    
    # Payment details
    payment_details = []
    for payment in payments[:500]:  # Limit for performance
        payment_details.append({
            'date': payment.transaction_date.strftime('%Y-%m-%d %H:%M'),
            'reference': payment.provider_reference or str(payment.id),
            'student': payment.student.full_name,
            'student_id': payment.student.student_id,
            'amount': float(payment.amount),
            'method': payment.get_method_display(),
            'invoice': payment.invoice.invoice_number if payment.invoice else '',
        })
    
    report = {
        'period': {
            'start_date': start_date or 'All time',
            'end_date': end_date or 'Present',
        },
        'summary': {
            'total_payments': total_count,
            'total_amount': float(total_amount),
            'average_payment': float(total_amount / total_count) if total_count > 0 else 0,
        },
        'payments': payment_details,
    }
    
    # Export handling
    if export_format != 'json':
        filename = f'payment_report_{datetime.now().strftime("%Y%m%d")}'
        title = 'Payment Report'
        
        if export_format == 'csv':
            return export_to_csv(payment_details, f'{filename}.csv')
        elif export_format == 'excel':
            return export_to_excel(payment_details, f'{filename}.xlsx', title=title)
        elif export_format == 'pdf':
            return export_to_pdf(payment_details, f'{filename}.pdf', title=title)
    
    return Response(report)


@api_view(['GET'])
@permission_classes([IsStaffOrAbove])
def enrollment_report(request):
    """
    Enrollment statistics and trends
    
    GET /api/reports/enrollments/?session=UUID&level=LEVEL&format=json
    Formats: json, csv, excel, pdf
    """
    session_id = request.query_params.get('session')
    level = request.query_params.get('level')
    export_format = request.query_params.get('export_format') or request.query_params.get('export') or request.query_params.get('format', 'json')
    
    # Filter enrollments
    enrollments = Enrollment.objects.select_related('student__user', 'session', 'level')
    
    if session_id:
        enrollments = enrollments.filter(session_id=session_id)
    if level:
        enrollments = enrollments.filter(level__level_type=level)
    
    # Statistics
    total_enrollments = enrollments.count()
    active_enrollments = enrollments.filter(status='active').count()
    
    # By level
    by_level = enrollments.values('level__name').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # By status
    by_status = enrollments.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    # Enrollment details
    enrollment_details = []
    for enrollment in enrollments[:500]:
        enrollment_details.append({
            'student': enrollment.student.full_name,
            'student_id': enrollment.student.student_id,
            'session': enrollment.session.label,
            'level': enrollment.level.name,
            'status': enrollment.status,
            'enrolled_date': enrollment.enrolled_at.strftime('%Y-%m-%d'),
        })
    
    report = {
        'summary': {
            'total_enrollments': total_enrollments,
            'active_enrollments': active_enrollments,
        },
        'by_level': list(by_level),
        'by_status': list(by_status),
        'enrollments': enrollment_details,
    }
    
    # Export handling
    if export_format != 'json':
        filename = f'enrollment_report_{datetime.now().strftime("%Y%m%d")}'
        title = 'Enrollment Report'
        
        if export_format == 'csv':
            return export_to_csv(enrollment_details, f'{filename}.csv')
        elif export_format == 'excel':
            return export_to_excel(enrollment_details, f'{filename}.xlsx', title=title)
        elif export_format == 'pdf':
            return export_to_pdf(enrollment_details, f'{filename}.pdf', title=title)
    
    return Response(report)
