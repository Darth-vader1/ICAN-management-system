from django.urls import path

from .views import PaystackInitializeView, PaystackVerifyView, PaystackWebhookView

urlpatterns = [
    # Paystack integration
    path('paystack/initialize/', PaystackInitializeView.as_view(), name='paystack-initialize'),
    path('paystack/verify/<str:reference>/', PaystackVerifyView.as_view(), name='paystack-verify'),
    path('paystack/webhook/', PaystackWebhookView.as_view(), name='paystack-webhook'),
]