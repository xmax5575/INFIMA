from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import Subject
from django.core.exceptions import ValidationError

User = get_user_model()

class questionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="subject@test.com",
            first_name="Subject",
            last_name="Test",
            role="Student",
            password="Subject123"
        )

    # * Test za nepodržan subject
    def test_unsupported_subject(self):
        unsupported = Subject.objects.create(
            subject_id=1,
            name="Hrvatski"
        )

        with self.assertRaises(ValidationError):
            unsupported.full_clean()

    # * Test za uspješno kreiranje predmeta
    def test_regular_subject(self):
        regular = Subject.objects.create(
            subject_id=2,
            name="Matematika"
        )

        retrieved = Subject.objects.get(name="Matematika")

        # ! Provjeri je li ime predmeta "Matematika"
        self.assertEqual(retrieved.name, "Matematika")

        # ! Provjeri je li se subject napravio u bazi
        self.assertTrue(Subject.objects.filter(subject_id=2).exists())