import logging
from django.apps import AppConfig

logger = logging.getLogger(__name__)


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"

    def ready(self):
        try:
            from users.models import Permission, RoleModel
            if Permission.objects.count() == 0 or RoleModel.objects.count() == 0:
                logger.info("RBAC tables empty. Running seed_rbac...")
                from django.core.management import call_command
                call_command("seed_rbac")
        except Exception as e:
            logger.debug(f"RBAC auto-seed check skipped: {e}")
