import os
import django
import sys

sys.path.append(r"C:\Users\HP\Documents\projects\ICAN management system\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from users.models import RoleModel

for role in RoleModel.objects.all():
    perms = list(role.permissions.values_list('codename', flat=True))
    print(f"Role: {role.name} ({role.code})")
    print(f"  Permissions ({len(perms)}): {perms}")
