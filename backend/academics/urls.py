from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AcademicSessionViewSet,
    ClassScheduleViewSet,
    ClassViewSet,
    CourseOfferingViewSet,
    CourseViewSet,
    LevelViewSet,
    ScheduleTemplateViewSet,
)

router = DefaultRouter()
router.register(r'levels', LevelViewSet, basename='level')
router.register(r'sessions', AcademicSessionViewSet, basename='session')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'offerings', CourseOfferingViewSet, basename='offering')
router.register(r'classes', ClassViewSet, basename='class')
router.register(r'schedules', ClassScheduleViewSet, basename='schedule')
router.register(r'schedule-templates', ScheduleTemplateViewSet, basename='schedule-template')

urlpatterns = [
    path('', include(router.urls)),
]