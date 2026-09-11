import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from users.models import User, Role, StaffProfile


def create_admin_user():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@icantutorial.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "AdminPass123!")

    user, created = User.objects.get_or_create(
        email=admin_email,
        defaults={
            "role": Role.SUPER_ADMIN,
            "is_staff": True,
            "is_superuser": True,
            "is_verified": True,
            "is_active": True,
        },
    )

    # Always ensure proper permissions and password
    user.is_staff = True
    user.is_superuser = True
    user.is_verified = True
    user.is_active = True
    user.role = Role.SUPER_ADMIN
    user.set_password(admin_password)
    user.save()

    StaffProfile.objects.get_or_create(
        user=user,
        defaults={
            "first_name": "System",
            "last_name": "Admin",
            "department": "IT Administration",
        },
    )

    if created:
        print(f"✅ Successfully created admin account: {admin_email}")
    else:
        print(f"✅ Updated credentials & permissions for admin account: {admin_email}")


def cleanup_sample_data():
    try:
        from notifications.models import Announcement
        sample_titles = [
            "Q3 Class Schedule Update",
            "Fee Payment Deadline Reminder",
            "New Study Materials Available",
        ]
        deleted_count, _ = Announcement.objects.filter(
            title__in=sample_titles
        ).delete()
        if deleted_count > 0:
            print(f"🧹 Cleaned up {deleted_count} sample announcement(s).")
    except Exception as e:
        print(f"Sample cleanup notice: {e}")


if __name__ == "__main__":
    create_admin_user()
    cleanup_sample_data()
