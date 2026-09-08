"""
Service abstractions for Email and WhatsApp. Business logic elsewhere in the
codebase should only ever call EmailService / WhatsAppService — never a
provider SDK directly — so the concrete provider can change without
touching call sites (spec §21, §22).
"""
from django.conf import settings


class EmailService:
    @staticmethod
    def send_template(*, to: str, template_key: str, context: dict):
        """
        Renders NotificationTemplate(key=template_key) with `context` and
        sends via the configured provider (settings.EMAIL_PROVIDER).
        Implementation deliberately left as a provider-specific adapter to
        be filled in during Phase 6 (Communication).
        """
        raise NotImplementedError("Wire up provider adapter in Phase 6.")


class WhatsAppService:
    @staticmethod
    def send_template(*, to: str, template_key: str, context: dict):
        """
        Sends an approved WhatsApp Business Platform template message.
        Never implemented via unofficial scraping/automation (spec §22, §48).
        """
        raise NotImplementedError("Wire up WhatsApp Business API adapter in Phase 6.")