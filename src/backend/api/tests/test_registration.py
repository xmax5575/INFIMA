from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

#Testira endpoint za registraciju korisnika (/api/user/register/).
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

    #Provjerava da endpoint uspješno kreira korisnika sa svim validnim podacima.
    #Očekuje HTTP 201 i provjerava da su email i password ispravno spremljeni.
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

    #Provjerava da kratka ili nevaljana lozinka vraća HTTP 400.
    #Endpoint vraća error u polju 'password' i ne kreira korisnika.
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

    #Provjerava da nedostajući email vraća HTTP 400 i error u polju 'email'.
    #Korisnik se ne kreira.
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

    #Provjerava da neispravan format emaila vraća HTTP 400.
    #Error se nalazi u polju 'email'.
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

    #Provjerava da duplicirani email vraća HTTP 400 i da se ne kreira novi korisnik.
    def test_user_creation_duplicate_email(self):
        self.client.post(self.url, self.valid_payload, format="json")
        response = self.client.post(self.url, self.valid_payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)
        self.assertEqual(User.objects.count(), 1)

    #Provjerava da prazna lozinka vraća HTTP 400 i error u polju 'password'.
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

    #Provjerava da null lozinka vraća HTTP 400 i error u polju 'password'.
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

    #Provjerava da nedostajući first_name vraća HTTP 400 i error u polju 'first_name'.
    def test_user_creation_missing_first_name(self):
        payload = {
            "email": "nofirst@test.com",
            "last_name": "User",
            "password": "StrongPass123!"
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("first_name", response.data)

    #Provjerava da nedostajući last_name vraća HTTP 400 i error u polju 'last_name'.
    def test_user_creation_missing_last_name(self):
        payload = {
            "email": "nolast@test.com",
            "first_name": "No",
            "password": "StrongPass123!"
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("last_name", response.data)

    #Provjerava da dodatna polja koja nisu podržana u serializeru vraćaju HTTP 400.
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

    #Provjerava da slanje praznog payload-a vraća HTTP 400.
    def test_user_creation_empty_payload(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, 400)

    #Provjerava da GET metoda nije dopuštena na endpointu registracije.
    #Očekuje HTTP 400, 401, 403 ili 405.
    def test_user_creation_get_not_allowed(self):
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [400, 401, 403, 405])
