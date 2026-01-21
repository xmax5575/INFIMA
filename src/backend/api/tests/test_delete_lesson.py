from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import Instructor, Lesson, Subject

User = get_user_model()


class LessonDeletePermissionTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.subject = Subject.objects.create(name="Matematika")

        # Instructor A (owner)
        self.inst_a_user = User.objects.create_user(
            email="inst_a@test.com",
            password="test123",
            first_name="Ivo",
            last_name="A",
        )
        self.inst_a_user.role = "INSTRUCTOR"
        self.inst_a_user.save()

        self.inst_a = Instructor.objects.create(
            instructor_id=self.inst_a_user,
            price=20,
        )

        # Instructor B (attacker)
        self.inst_b_user = User.objects.create_user(
            email="inst_b@test.com",
            password="test123",
            first_name="Ivo",
            last_name="B",
        )
        self.inst_b_user.role = "INSTRUCTOR"
        self.inst_b_user.save()

        self.inst_b = Instructor.objects.create(
            instructor_id=self.inst_b_user,
            price=25,
        )

        # Lesson owned by Instructor A
        self.lesson = Lesson.objects.create(
            instructor_id=self.inst_a,
            subject=self.subject,
            is_available=True,
            status="ACTIVE",
            max_students=1,
        )

        self.delete_url = f"/api/termin/delete/{self.lesson.lesson_id}/"

    def test_instructor_cannot_delete_other_instructors_lesson(self):
        self.client.force_authenticate(user=self.inst_b_user)

        response = self.client.delete(self.delete_url)

        self.assertIn(response.status_code, [403, 404])

        # Lekcija mora ostati u bazi
        self.assertTrue(Lesson.objects.filter(lesson_id=self.lesson.lesson_id).exists())

    def test_instructor_can_delete_own_lesson(self):
        self.client.force_authenticate(user=self.inst_a_user)

        response = self.client.delete(self.delete_url)

        self.assertIn(response.status_code, [200, 202, 204])
        self.assertFalse(Lesson.objects.filter(lesson_id=self.lesson.lesson_id).exists())
