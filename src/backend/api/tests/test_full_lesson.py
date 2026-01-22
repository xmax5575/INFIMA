from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import Lesson, Instructor, Student, Subject, Attendance

User = get_user_model()


class ReserveLessonEdgeCaseTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/lessons/reserve/"

        self.subject = Subject.objects.create(name="Matematika")

        self.instructor_user = User.objects.create_user(
            email="inst@test.com",
            password="test123",
            first_name="Ivo",
            last_name="Instruktor"
        )
        self.instructor_user.role = "INSTRUCTOR"
        self.instructor_user.save()

        self.instructor = Instructor.objects.create(
            instructor_id=self.instructor_user,
            price=20
        )

        self.lesson = Lesson.objects.create(
            instructor_id=self.instructor,
            subject=self.subject,
            max_students=1,
            is_available=True,
            status="ACTIVE"
        )

        self.student1_user = User.objects.create_user(
            email="student1@test.com",
            password="test123",
            first_name="Ana",
            last_name="Student"
        )
        self.student1_user.role = "STUDENT"
        self.student1_user.save()
        self.student1 = Student.objects.create(student_id=self.student1_user)

        Attendance.objects.create(
            lesson=self.lesson,
            student=self.student1
        )

        self.student2_user = User.objects.create_user(
            email="student2@test.com",
            password="test123",
            first_name="Marko",
            last_name="Student"
        )
        self.student2_user.role = "STUDENT"
        self.student2_user.save()
        self.student2 = Student.objects.create(student_id=self.student2_user)

    def test_student_cannot_reserve_full_lesson(self):
        self.client.force_authenticate(user=self.student2_user)

        response = self.client.post(
            self.url,
            {"lesson_id": self.lesson.lesson_id},
            format="json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "Lesson is full")

        self.assertEqual(
            Attendance.objects.filter(lesson=self.lesson).count(),
            1
        )
