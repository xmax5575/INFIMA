from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class UserRoleSelectionTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/select-role/"
        
        self.user = User.objects.create_user(
            email="roleuser@test.com",
            first_name="Role",
            last_name="User",
            password="StrongPass123!"
        )

    def test_select_student_role(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {"role": "student"}, format="json")  # <-- mali letters
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Role.STUDENT)

    def test_select_instructor_role(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {"role": "instructor"}, format="json")  # <-- mali letters
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Role.INSTRUCTOR)

    def test_unauthorized_user_cannot_select_role(self):
        response = self.client.post(self.url, {"role": "STUDENT"}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_invalid_role(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {"role": "CEO"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertIsNone(self.user.role)

    def test_empty_payload(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertIsNone(self.user.role)

    def test_role_already_set(self):
        self.user.role = "STUDENT"
        self.user.save()
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {"role": "INSTRUCTOR"}, format="json")
        self.assertIn(response.status_code, [400, 403])
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, "STUDENT")