from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User, Role, RoleModel, Permission
from audit.models import AuditLog


class RBACPermissionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Seed permissions
        self.perm_view_students = Permission.objects.create(
            codename="students.view",
            name="View Students",
            module="students",
            description="View student profiles",
            is_system=True,
        )
        self.perm_edit_students = Permission.objects.create(
            codename="students.edit",
            name="Edit Students",
            module="students",
            description="Edit student profiles",
            is_system=True,
        )
        self.perm_manage_roles = Permission.objects.create(
            codename="roles.assign_permissions",
            name="Configure Role Permissions",
            module="roles",
            description="Configure role permissions",
            is_system=True,
        )

        # Create System Roles
        self.role_super_admin = RoleModel.objects.create(
            name="Super Admin",
            code=Role.SUPER_ADMIN,
            is_system=True,
            is_protected=True,
        )
        self.role_super_admin.permissions.add(
            self.perm_view_students, self.perm_edit_students, self.perm_manage_roles
        )

        self.role_student_officer = RoleModel.objects.create(
            name="Student Officer",
            code=Role.STUDENT_OFFICER,
            is_system=True,
            is_protected=False,
        )
        self.role_student_officer.permissions.add(self.perm_view_students)

        # Create Users
        self.super_admin_user = User.objects.create_superuser(
            email="superadmin@ican.edu",
            password="SuperPassword123!",
            role=Role.SUPER_ADMIN,
        )
        self.super_admin_user.roles.add(self.role_super_admin)

        self.officer_user = User.objects.create_user(
            email="officer@ican.edu",
            password="OfficerPassword123!",
            role=Role.STUDENT_OFFICER,
            is_staff=True,
        )
        self.officer_user.roles.add(self.role_student_officer)

    def test_has_permission_method_super_admin(self):
        """Super Admin possesses all permissions."""
        self.assertTrue(self.super_admin_user.has_permission("students.view"))
        self.assertTrue(self.super_admin_user.has_permission("students.edit"))
        self.assertTrue(self.super_admin_user.has_permission("non_existent.permission"))

    def test_has_permission_method_regular_user(self):
        """Regular user possesses only assigned role permissions."""
        self.assertTrue(self.officer_user.has_permission("students.view"))
        self.assertFalse(self.officer_user.has_permission("students.edit"))
        self.assertFalse(self.officer_user.has_permission("roles.assign_permissions"))

    def test_prevent_system_role_deletion(self):
        """Deleting system or protected roles via API must return 400 Bad Request."""
        self.client.force_authenticate(user=self.super_admin_user)
        response = self.client.delete(f"/api/roles/{self.role_super_admin.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("protected", str(response.data))

    def test_custom_role_creation_and_permission_assignment(self):
        """Authorized user can create custom role and assign permissions."""
        self.client.force_authenticate(user=self.super_admin_user)
        payload = {
            "name": "Admissions Clerk",
            "code": "admissions_clerk",
            "description": "Handles student intake",
            "permissions": ["students.view"],
        }
        response = self.client.post("/api/roles/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_role = RoleModel.objects.get(code="admissions_clerk")
        self.assertFalse(created_role.is_system)
        self.assertIn(self.perm_view_students, created_role.permissions.all())

    def test_self_escalation_prevention(self):
        """User without permission X cannot grant permission X to a role."""
        self.client.force_authenticate(user=self.officer_user)
        payload = {
            "name": "Elevated Role",
            "code": "elevated_role",
            "description": "Attempting self-escalation",
            "permissions": ["students.edit"],  # officer does NOT have students.edit
        }
        response = self.client.post("/api/roles/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("You cannot grant permissions you do not possess", str(response.data))

    def test_audit_log_record_on_role_update(self):
        """Role modification creates audit log entry."""
        self.client.force_authenticate(user=self.super_admin_user)
        payload = {
            "name": "Student Officer Updated",
            "permissions": ["students.view", "students.edit"],
        }
        response = self.client.patch(f"/api/roles/{self.role_student_officer.id}/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        audit_entry = AuditLog.objects.filter(entity_type="RoleModel", entity_id=str(self.role_student_officer.id)).first()
        self.assertIsNotNone(audit_entry)
        self.assertEqual(audit_entry.action, "role_updated")
