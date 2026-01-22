from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class UserCreationTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/user/register/"

        self.valid_payload = {
            "email": "test@test.com",
            "first_name": "Test",
            "last_name": "User",
            "password": "StrongPass123!",
        }

    def test_user_creation_success(self):
        response = self.client.post(
            self.url,
            self.valid_payload,
            format="json"
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.count(), 1)

        user = User.objects.first()
        self.assertEqual(user.email, "test@test.com")
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_user_creation_invalid_password(self):
        invalid_payload = {
            "email": "bad@test.com",
            "first_name": "Bad",
            "last_name": "Password",
            "password": "123",
        }

        response = self.client.post(
            self.url,
            invalid_payload,
            format="json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(User.objects.count(), 0)
        self.assertIn("password", response.data)

    def test_user_creation_missing_email(self):
        payload = {
            "first_name": "No",
            "last_name": "Email",
            "password": "StrongPass123!"
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)
        self.assertEqual(User.objects.count(), 0)

    def test_user_creation_invalid_email_format(self):
        payload = {
            "email": "not-an-email",
            "first_name": "Bad",
            "last_name": "Email",
            "password": "StrongPass123!"
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_user_creation_duplicate_email(self):
        self.client.post(self.url, self.valid_payload, format="json")
        response = self.client.post(self.url, self.valid_payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)
        self.assertEqual(User.objects.count(), 1)

    def test_user_creation_empty_password(self):
        payload = {
            "email": "empty@test.com",
            "first_name": "Empty",
            "last_name": "Password",
            "password": "",
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_user_creation_null_password(self):
        payload = {
            "email": "null@test.com",
            "first_name": "Null",
            "last_name": "Password",
            "password": None,
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_user_creation_missing_first_name(self):
        payload = {
            "email": "nofirst@test.com",
            "last_name": "User",
            "password": "StrongPass123!"
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("first_name", response.data)

    def test_user_creation_missing_last_name(self):
        payload = {
            "email": "nolast@test.com",
            "first_name": "No",
            "password": "StrongPass123!"
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("last_name", response.data)

    def test_user_creation_with_extra_field(self):
        payload = {
            "email": "extra@test.com",
            "first_name": "Extra",
            "last_name": "Field",
            "password": "StrongPass123!",
            "is_admin": True,
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)

    def test_user_creation_empty_payload(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_user_creation_get_not_allowed(self):
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [400, 401, 403, 405])
