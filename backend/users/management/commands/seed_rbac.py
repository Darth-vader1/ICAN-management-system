from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User, Role, RoleModel, Permission

PERMISSIONS_DATA = [
    # Students module (4)
    {"codename": "students.view", "name": "View Students", "module": "students", "description": "View student profiles and academic records"},
    {"codename": "students.create", "name": "Create Students", "module": "students", "description": "Add new student profiles"},
    {"codename": "students.edit", "name": "Edit Students", "module": "students", "description": "Modify student details"},
    {"codename": "students.delete", "name": "Delete Students", "module": "students", "description": "Remove student profiles"},

    # Academics module (2)
    {"codename": "academics.view", "name": "View Academics", "module": "academics", "description": "View sessions, courses, levels, and timetables"},
    {"codename": "academics.manage", "name": "Manage Academics", "module": "academics", "description": "Create and edit sessions, courses, levels, and timetables"},

    # Enrollments module (2)
    {"codename": "enrollments.view", "name": "View Enrollments", "module": "enrollments", "description": "View student course enrollments"},
    {"codename": "enrollments.manage", "name": "Manage Enrollments", "module": "enrollments", "description": "Create, approve, or cancel student enrollments"},

    # Billing module (2)
    {"codename": "billing.view", "name": "View Invoices & Fees", "module": "billing", "description": "View fee structures and student invoices"},
    {"codename": "billing.manage", "name": "Manage Invoices & Fees", "module": "billing", "description": "Generate, edit, or adjust invoices and fee structures"},

    # Payments module (3)
    {"codename": "payments.view", "name": "View Payments", "module": "payments", "description": "View payment receipts and transaction records"},
    {"codename": "payments.manage", "name": "Manage Payments", "module": "payments", "description": "Record manual payments, process refunds"},
    {"codename": "payments.verify", "name": "Verify Payments", "module": "payments", "description": "Verify external bank transfers and payment claims"},

    # Attendance module (2)
    {"codename": "attendance.view", "name": "View Attendance", "module": "attendance", "description": "View attendance registers and summaries"},
    {"codename": "attendance.mark", "name": "Mark Attendance", "module": "attendance", "description": "Record or modify class attendance"},

    # Notifications module (2)
    {"codename": "notifications.view", "name": "View Notifications", "module": "notifications", "description": "View system announcements and notifications"},
    {"codename": "notifications.send", "name": "Send Notifications", "module": "notifications", "description": "Broadcast notices to students or staff"},

    # Reports module (2)
    {"codename": "reports.view", "name": "View Reports", "module": "reports", "description": "View academic and financial analytics dashboards"},
    {"codename": "reports.export", "name": "Export Reports", "module": "reports", "description": "Export CSV/PDF reports"},

    # Audit module (1)
    {"codename": "audit.view", "name": "View Audit Logs", "module": "audit", "description": "Inspect system audit trails and security logs"},

    # Users module (5)
    {"codename": "users.view", "name": "View Users", "module": "users", "description": "View staff and user directory"},
    {"codename": "users.create", "name": "Create Users", "module": "users", "description": "Provision new staff accounts"},
    {"codename": "users.edit", "name": "Edit Users", "module": "users", "description": "Update user profiles and status"},
    {"codename": "users.delete", "name": "Delete Users", "module": "users", "description": "Deactivate or remove user accounts"},
    {"codename": "users.assign_roles", "name": "Assign User Roles", "module": "users", "description": "Assign system and custom roles to users"},

    # Roles module (5)
    {"codename": "roles.view", "name": "View Roles & Permissions", "module": "roles", "description": "View role configurations and permission matrix"},
    {"codename": "roles.create", "name": "Create Roles", "module": "roles", "description": "Define new custom roles"},
    {"codename": "roles.edit", "name": "Edit Roles", "module": "roles", "description": "Modify role titles and descriptions"},
    {"codename": "roles.delete", "name": "Delete Roles", "module": "roles", "description": "Remove custom roles"},
    {"codename": "roles.assign_permissions", "name": "Configure Role Permissions", "module": "roles", "description": "Grant or revoke permissions from roles"},

    # Classroom module (4)
    {"codename": "classroom.view", "name": "View Virtual Classes", "module": "classroom", "description": "View scheduled live classes and recordings"},
    {"codename": "classroom.create", "name": "Create Virtual Class", "module": "classroom", "description": "Schedule new virtual classrooms"},
    {"codename": "classroom.join", "name": "Join Virtual Class", "module": "classroom", "description": "Enter live virtual class sessions"},
    {"codename": "classroom.moderate", "name": "Moderate Virtual Class", "module": "classroom", "description": "Mute, kick, or record live class sessions"},

    # Settings module (2)
    {"codename": "settings.view", "name": "View Settings", "module": "settings", "description": "View system configuration settings"},
    {"codename": "settings.manage", "name": "Manage Settings", "module": "settings", "description": "Update application settings"},

    # Dashboard module (1)
    {"codename": "dashboard.view", "name": "View Admin Dashboard", "module": "dashboard", "description": "Access main admin dashboard"},
]

SYSTEM_ROLES = [
    {
        "code": "super_admin",
        "name": "Super Admin",
        "description": "Full system control with unrestricted access to all modules and configurations.",
        "is_system": True,
        "is_protected": True,
        "permissions_all": True,
    },
    {
        "code": "manager",
        "name": "Manager",
        "description": "Executive manager with broad operational authority across academic and administrative modules.",
        "is_system": True,
        "is_protected": False,
        "permissions_exclude": ["audit.view", "roles.assign_permissions", "roles.delete"],
    },
    {
        "code": "finance",
        "name": "Finance Staff",
        "description": "Financial administrator responsible for billing, invoices, payments, and financial reports.",
        "is_system": True,
        "is_protected": False,
        "permission_prefixes": ["billing.", "payments.", "reports."],
        "extra_permissions": ["dashboard.view", "notifications.view"],
    },
    {
        "code": "student_officer",
        "name": "Student Officer",
        "description": "Academic staff managing student records, enrollments, class timetables, and attendance.",
        "is_system": True,
        "is_protected": False,
        "permission_prefixes": ["students.", "enrollments.", "attendance.", "classroom."],
        "extra_permissions": ["dashboard.view", "notifications.view", "notifications.send"],
    },
    {
        "code": "it_admin",
        "name": "IT Admin",
        "description": "System administrator managing user accounts, security roles, system settings, and audit trails.",
        "is_system": True,
        "is_protected": False,
        "permission_prefixes": ["users.", "roles.", "settings."],
        "extra_permissions": ["audit.view", "dashboard.view"],
    },
    {
        "code": "student",
        "name": "Student",
        "description": "Enrolled student account with access to learning materials, virtual classrooms, and personal invoices.",
        "is_system": True,
        "is_protected": False,
        "permissions_exact": ["classroom.join", "notifications.view", "dashboard.view"],
    },
]

CUSTOM_ROLES = [
    {
        "code": "admissions_officer",
        "name": "Admissions Officer",
        "description": "Focuses on new student onboarding, profile creation, and course registration processing.",
        "permissions_exact": ["students.view", "students.create", "enrollments.view", "enrollments.manage", "notifications.view", "dashboard.view"],
    },
    {
        "code": "academic_coordinator",
        "name": "Academic Coordinator",
        "description": "Coordinates course offerings, virtual classroom scheduling, and class attendance.",
        "permissions_exact": ["academics.view", "academics.manage", "classroom.view", "classroom.create", "classroom.moderate", "attendance.view", "attendance.mark", "dashboard.view"],
    },
    {
        "code": "account_assistant",
        "name": "Account Assistant",
        "description": "Assists with manual payment entry, invoice checking, and financial record keeping.",
        "permissions_exact": ["billing.view", "payments.view", "payments.manage", "reports.view", "dashboard.view"],
    },
    {
        "code": "class_coordinator",
        "name": "Class Coordinator",
        "description": "Oversees live virtual classroom moderation, attendance logging, and student participation.",
        "permissions_exact": ["classroom.view", "classroom.create", "classroom.join", "classroom.moderate", "attendance.mark", "dashboard.view"],
    },
    {
        "code": "auditor",
        "name": "Auditor",
        "description": "Read-only access to audit logs, financial summaries, and exportable reports for compliance.",
        "permissions_exact": ["reports.view", "reports.export", "audit.view", "billing.view", "payments.view", "dashboard.view"],
    },
    {
        "code": "reception_officer",
        "name": "Reception Officer",
        "description": "Front desk officer viewing student profiles, attendance, and broadcasting general announcements.",
        "permissions_exact": ["students.view", "students.create", "attendance.view", "notifications.view", "dashboard.view"],
    },
]


class Command(BaseCommand):
    help = "Seed RBAC 36 granular permissions and system/custom roles."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding permissions...")
        perm_map = {}
        for item in PERMISSIONS_DATA:
            perm, created = Permission.objects.update_or_create(
                codename=item["codename"],
                defaults={
                    "name": item["name"],
                    "module": item["module"],
                    "description": item["description"],
                    "is_system": True,
                }
            )
            perm_map[item["codename"]] = perm

        self.stdout.write(f"Seeded {len(perm_map)} permissions across 14 modules.")

        all_perms = list(perm_map.values())

        # Seed System Roles
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
            if rdata.get("permissions_all"):
                role_obj.permissions.set(all_perms)
            elif "permissions_exclude" in rdata:
                excl = set(rdata["permissions_exclude"])
                assigned = [p for codename, p in perm_map.items() if codename not in excl]
                role_obj.permissions.set(assigned)
            elif "permission_prefixes" in rdata:
                prefixes = tuple(rdata["permission_prefixes"])
                extras = set(rdata.get("extra_permissions", []))
                assigned = [p for codename, p in perm_map.items() if codename.startswith(prefixes) or codename in extras]
                role_obj.permissions.set(assigned)
            elif "permissions_exact" in rdata:
                exacts = set(rdata["permissions_exact"])
                assigned = [p for codename, p in perm_map.items() if codename in exacts]
                role_obj.permissions.set(assigned)

        # Seed Custom Roles
        for crole in CUSTOM_ROLES:
            role_obj, _ = RoleModel.objects.update_or_create(
                code=crole["code"],
                defaults={
                    "name": crole["name"],
                    "description": crole["description"],
                    "is_system": False,
                    "is_protected": False,
                }
            )
            exacts = set(crole["permissions_exact"])
            assigned = [p for codename, p in perm_map.items() if codename in exacts]
            role_obj.permissions.set(assigned)

        self.stdout.write("Linking existing users to RoleModel instances based on user.role...")
        for user in User.objects.all():
            try:
                role_obj = RoleModel.objects.get(code=user.role)
                if not user.roles.filter(id=role_obj.id).exists():
                    user.roles.add(role_obj)
            except RoleModel.DoesNotExist:
                pass

        self.stdout.write(self.style.SUCCESS("RBAC Seeding complete!"))
