from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VirtualClassViewSet
from .webhooks import livekit_webhook_view

router = DefaultRouter()
router.register(r'', VirtualClassViewSet, basename='virtual-class')

urlpatterns = [
    path('webhooks/livekit/', livekit_webhook_view, name='livekit-webhook'),
    path('', include(router.urls)),
]
