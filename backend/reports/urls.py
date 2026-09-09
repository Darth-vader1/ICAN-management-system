from django.urls import path

from .views import (
    financial_summary_report,
    student_report,
    attendance_report,
    payment_report,
    enrollment_report,
)

urlpatterns = [
    path('financial-summary/', financial_summary_report, name='financial-summary-report'),
    path('students/', student_report, name='student-report'),
    path('attendance/', attendance_report, name='attendance-report'),
    path('payments/', payment_report, name='payment-report'),
    path('enrollments/', enrollment_report, name='enrollment-report'),
]