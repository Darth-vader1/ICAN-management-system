from django.core.management.base import BaseCommand
from users.models import RoleModel

class Command(BaseCommand):
    help = 'List all roles and their permissions'

    def handle(self, *args, **options):
        for role in RoleModel.objects.all():
            perms = list(role.permissions.values_list('codename', flat=True))
            self.stdout.write(f"Role: {role.name} ({role.code})")
            self.stdout.write(f"  Permissions ({len(perms)}): {perms}")
