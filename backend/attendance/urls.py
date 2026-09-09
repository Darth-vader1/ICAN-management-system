from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ClassSessionViewSet, AttendanceRecordViewSet

router = DefaultRouter()
router.register(r'class-sessions', ClassSessionViewSet, basename='class-session')
router.register(r'records', AttendanceRecordViewSet, basename='attendance-record')

urlpatterns = [
    path('', include(router.urls)),
]