from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    FeeStructureViewSet, InvoiceViewSet, PaymentViewSet,
    RefundViewSet, FinancialProfileViewSet, LevelTierPricingViewSet
)

router = DefaultRouter()
router.register(r'fees', FeeStructureViewSet, basename='fee-structure')
router.register(r'level-tiers', LevelTierPricingViewSet, basename='level-tier')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'refunds', RefundViewSet, basename='refund')
router.register(r'financial-profile', FinancialProfileViewSet, basename='financial-profile')

urlpatterns = [
    path('', include(router.urls)),
]