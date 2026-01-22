from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class UserLoginTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/token/"

        self.password = "StrongPass123!"

        self.user = User.objects.create_user(
            email="login@test.com",
            first_name="Login",
            last_name="User",
            password=self.password,
        )

    def test_login_success(self):
        response = self.client.post(
            self.url,
            {
                "email": "login@test.com",
                "password": self.password
            },
            format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password(self):
        response = self.client.post(
            self.url,
            {
                "email": "login@test.com",
                "password": "WrongPassword123"
            },
            format="json"
        )

        self.assertEqual(response.status_code, 401)

    def test_login_non_existing_user(self):
        response = self.client.post(
            self.url,
            {
                "email": "nouser@test.com",
                "password": "SomePassword123"
            },
            format="json"
        )

        self.assertEqual(response.status_code, 401)

    def test_login_missing_password(self):
        response = self.client.post(
            self.url,
            {
                "email": "login@test.com"
            },
            format="json"
        )

        self.assertEqual(response.status_code, 400)

    def test_login_missing_email(self):
        response = self.client.post(
            self.url,
            {
                "password": self.password
            },
            format="json"
        )

        self.assertEqual(response.status_code, 400)

    def test_login_empty_payload(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_login_get_not_allowed(self):
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [400, 401, 403, 405])

    def test_login_inactive_user(self):
        self.user.is_active = False
        self.user.save()

        response = self.client.post(
            self.url,
            {
                "email": self.user.email,
                "password": self.password
            },
            format="json"
        )

        self.assertEqual(response.status_code, 401)

    def test_access_profile_with_token(self):
        login = self.client.post(
            self.url,
            {
                "email": self.user.email,
                "password": self.password
            },
            format="json"
        )

        token = login.data["access"]
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.get("/api/user/profile/")
        self.assertEqual(response.status_code, 200)