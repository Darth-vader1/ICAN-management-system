import logging
from django.apps import AppConfig
from django.db.models.signals import post_migrate

logger = logging.getLogger(__name__)


def seed_rbac_after_migration(sender, **kwargs):
    """Seed RBAC permissions and roles after migrations run, if tables are empty."""
    from users.models import Permission, RoleModel
    from django.core.management import call_command

    try:
        if Permission.objects.count() == 0 or RoleModel.objects.count() == 0:
            logger.info("RBAC tables empty. Running seed_rbac...")
            call_command("seed_rbac")
    except Exception as e:
        logger.debug(f"RBAC post-migrate auto-seed skipped: {e}")


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"

    def ready(self):
        post_migrate.connect(seed_rbac_after_migration, sender=self)
