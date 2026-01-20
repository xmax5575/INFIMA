from django.test import TestCase
from rest_framework.test import APIClient
from api.models import Lesson, Instructor, Subject, Student
from django.contrib.auth import get_user_model

User = get_user_model()

class LessonCreatePermissionTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/lessons/"

        # subject je obavezan foreign key u lessonu
        self.subject = Subject.objects.create(name="Matematika")

        self.payload = {
            "subject": self.subject.pk,
            "price": 20,
            "duration_min": 60,
            "max_students": 1,
            "format": "Online",
        }

    def test_anonymous_user_cannot_create_lesson(self):
        response = self.client.post(self.url, self.payload, format="json")

        self.assertIn(response.status_code, [401, 403])
        self.assertEqual(Lesson.objects.count(), 0)

    def test_student_cannot_create_lesson(self):
        user = User.objects.create_user(
            email="student@test.com",
            password="test123",
            first_name="Pero",
            last_name="Student")
        user.role = "STUDENT"
        user.save()

        Student.objects.create(student_id=user)

        self.client.force_authenticate(user=user)

        response = self.client.post(self.url, self.payload, format="json")

        self.assertIn(response.status_code, [400, 401, 403])
        self.assertEqual(Lesson.objects.count(), 0)



