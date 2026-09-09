from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    FeeStructureViewSet, InvoiceViewSet, PaymentViewSet,
    RefundViewSet, FinancialProfileViewSet
)

router = DefaultRouter()
router.register(r'fees', FeeStructureViewSet, basename='fee-structure')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'refunds', RefundViewSet, basename='refund')
router.register(r'financial-profile', FinancialProfileViewSet, basename='financial-profile')

urlpatterns = [
    path('', include(router.urls)),
]