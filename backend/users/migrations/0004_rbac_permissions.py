import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def seed_rbac_data(apps, schema_editor):
    Permission = apps.get_model("users", "Permission")
    RoleModel = apps.get_model("users", "RoleModel")
    User = apps.get_model("users", "User")

    PERMISSIONS_DATA = [
        {"codename": "students.view", "name": "View Students", "module": "students", "description": "View student profiles and academic records"},
        {"codename": "students.create", "name": "Create Students", "module": "students", "description": "Add new student profiles"},
        {"codename": "students.edit", "name": "Edit Students", "module": "students", "description": "Modify student details"},
        {"codename": "students.delete", "name": "Delete Students", "module": "students", "description": "Remove student profiles"},
        {"codename": "academics.view", "name": "View Academics", "module": "academics", "description": "View sessions, courses, levels, and timetables"},
        {"codename": "academics.manage", "name": "Manage Academics", "module": "academics", "description": "Create and edit sessions, courses, levels, and timetables"},
        {"codename": "enrollments.view", "name": "View Enrollments", "module": "enrollments", "description": "View student course enrollments"},
        {"codename": "enrollments.manage", "name": "Manage Enrollments", "module": "enrollments", "description": "Create, approve, or cancel student enrollments"},
        {"codename": "billing.view", "name": "View Invoices & Fees", "module": "billing", "description": "View fee structures and student invoices"},
        {"codename": "billing.manage", "name": "Manage Invoices & Fees", "module": "billing", "description": "Generate, edit, or adjust invoices and fee structures"},
        {"codename": "payments.view", "name": "View Payments", "module": "payments", "description": "View payment receipts and transaction records"},
        {"codename": "payments.manage", "name": "Manage Payments", "module": "payments", "description": "Record manual payments, process refunds"},
        {"codename": "payments.verify", "name": "Verify Payments", "module": "payments", "description": "Verify external bank transfers and payment claims"},
        {"codename": "attendance.view", "name": "View Attendance", "module": "attendance", "description": "View attendance registers and summaries"},
        {"codename": "attendance.mark", "name": "Mark Attendance", "module": "attendance", "description": "Record or modify class attendance"},
        {"codename": "notifications.view", "name": "View Notifications", "module": "notifications", "description": "View system announcements and notifications"},
        {"codename": "notifications.send", "name": "Send Notifications", "module": "notifications", "description": "Broadcast notices to students or staff"},
        {"codename": "reports.view", "name": "View Reports", "module": "reports", "description": "View academic and financial analytics dashboards"},
        {"codename": "reports.export", "name": "Export Reports", "module": "reports", "description": "Export CSV/PDF reports"},
        {"codename": "audit.view", "name": "View Audit Logs", "module": "audit", "description": "Inspect system audit trails and security logs"},
        {"codename": "users.view", "name": "View Users", "module": "users", "description": "View staff and user directory"},
        {"codename": "users.create", "name": "Create Users", "module": "users", "description": "Provision new staff accounts"},
        {"codename": "users.edit", "name": "Edit Users", "module": "users", "description": "Update user profiles and status"},
        {"codename": "users.delete", "name": "Delete Users", "module": "users", "description": "Deactivate or remove user accounts"},
        {"codename": "users.assign_roles", "name": "Assign User Roles", "module": "users", "description": "Assign system and custom roles to users"},
        {"codename": "roles.view", "name": "View Roles & Permissions", "module": "roles", "description": "View role configurations and permission matrix"},
        {"codename": "roles.create", "name": "Create Roles", "module": "roles", "description": "Define new custom roles"},
        {"codename": "roles.edit", "name": "Edit Roles", "module": "roles", "description": "Modify role titles and descriptions"},
        {"codename": "roles.delete", "name": "Delete Roles", "module": "roles", "description": "Remove custom roles"},
        {"codename": "roles.assign_permissions", "name": "Configure Role Permissions", "module": "roles", "description": "Grant or revoke permissions from roles"},
        {"codename": "classroom.view", "name": "View Virtual Classes", "module": "classroom", "description": "View scheduled live classes and recordings"},
        {"codename": "classroom.create", "name": "Create Virtual Class", "module": "classroom", "description": "Schedule new virtual classrooms"},
        {"codename": "classroom.join", "name": "Join Virtual Class", "module": "classroom", "description": "Enter live virtual class sessions"},
        {"codename": "classroom.moderate", "name": "Moderate Virtual Class", "module": "classroom", "description": "Mute, kick, or record live class sessions"},
        {"codename": "settings.view", "name": "View Settings", "module": "settings", "description": "View system configuration settings"},
        {"codename": "settings.manage", "name": "Manage Settings", "module": "settings", "description": "Update application settings"},
        {"codename": "dashboard.view", "name": "View Admin Dashboard", "module": "dashboard", "description": "Access main admin dashboard"},
    ]

    perm_map = {}
    for item in PERMISSIONS_DATA:
        perm, _ = Permission.objects.update_or_create(
            codename=item["codename"],
            defaults={
                "name": item["name"],
                "module": item["module"],
                "description": item["description"],
                "is_system": True,
            }
        )
        perm_map[item["codename"]] = perm

    all_perms = list(perm_map.values())

    SYSTEM_ROLES = [
        {"code": "super_admin", "name": "Super Admin", "description": "Full system control with unrestricted access.", "is_system": True, "is_protected": True, "all": True},
        {"code": "manager", "name": "Manager", "description": "Executive manager with broad operational authority.", "is_system": True, "is_protected": False, "exclude": ["audit.view", "roles.assign_permissions", "roles.delete"]},
        {"code": "finance", "name": "Finance Staff", "description": "Financial administrator responsible for billing, invoices, payments, and financial reports.", "is_system": True, "is_protected": False, "prefixes": ["billing.", "payments.", "reports."], "extras": ["dashboard.view", "notifications.view"]},
        {"code": "student_officer", "name": "Student Officer", "description": "Academic staff managing student records, enrollments, class timetables, and attendance.", "is_system": True, "is_protected": False, "prefixes": ["students.", "enrollments.", "attendance.", "classroom."], "extras": ["dashboard.view", "notifications.view", "notifications.send"]},
        {"code": "it_admin", "name": "IT Admin", "description": "System administrator managing user accounts, security roles, system settings, and audit trails.", "is_system": True, "is_protected": False, "prefixes": ["users.", "roles.", "settings."], "extras": ["audit.view", "dashboard.view"]},
        {"code": "student", "name": "Student", "description": "Enrolled student account with access to learning materials, virtual classrooms, and personal invoices.", "is_system": True, "is_protected": False, "exact": ["classroom.join", "notifications.view", "dashboard.view"]},
    ]

    for rdata in SYSTEM_ROLES:
        role_obj, _ = RoleModel.objects.update_or_create(
            code=rdata["code"],
            defaults={
                "name": rdata["name"],
                "description": rdata["description"],
                "is_system": rdata["is_system"],
                "is_protected": rdata.get("is_protected", False),
            }
        )
        if rdata.get("all"):
            role_obj.permissions.set(all_perms)
        elif "exclude" in rdata:
            excl = set(rdata["exclude"])
            role_obj.permissions.set([p for k, p in perm_map.items() if k not in excl])
        elif "prefixes" in rdata:
            prefixes = tuple(rdata["prefixes"])
            extras = set(rdata.get("extras", []))
            role_obj.permissions.set([p for k, p in perm_map.items() if k.startswith(prefixes) or k in extras])
        elif "exact" in rdata:
            exacts = set(rdata["exact"])
            role_obj.permissions.set([p for k, p in perm_map.items() if k in exacts])

    for user in User.objects.all():
        role_obj = RoleModel.objects.filter(code=user.role).first()
        if role_obj:
            user.roles.add(role_obj)


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_user_must_change_password"),
    ]

    operations = [
        migrations.CreateModel(
            name="Permission",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("codename", models.CharField(db_index=True, max_length=100, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("module", models.CharField(db_index=True, max_length=50)),
                ("description", models.TextField(blank=True, default="")),
                ("is_system", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["module", "codename"],
            },
        ),
        migrations.CreateModel(
            name="RoleModel",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=100)),
                ("code", models.CharField(db_index=True, max_length=50, unique=True)),
                ("description", models.TextField(blank=True, default="")),
                ("is_system", models.BooleanField(default=False)),
                ("is_protected", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("permissions", models.ManyToManyField(blank=True, related_name="roles", to="users.permission")),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.AddField(
            model_name="user",
            name="roles",
            field=models.ManyToManyField(blank=True, related_name="users", to="users.rolemodel"),
        ),
        migrations.RunPython(seed_rbac_data, reverse_code=migrations.RunPython.noop),
    ]
