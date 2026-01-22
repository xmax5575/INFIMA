from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import Instructor, Lesson, Subject, Student, Attendance, Summary

User = get_user_model()


class LessonSummaryFlowTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Priprema predmeta i korisnika za test toka sazetka.
        self.subject = Subject.objects.create(name="Matematika")

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

        self.inst_b_user = User.objects.create_user(
            email="inst_b@test.com",
            password="test123",
            first_name="Iva",
            last_name="B",
        )
        self.inst_b_user.role = "INSTRUCTOR"
        self.inst_b_user.save()
        self.inst_b = Instructor.objects.create(
            instructor_id=self.inst_b_user,
            price=25,
        )

        self.student_user = User.objects.create_user(
            email="student@test.com",
            password="test123",
            first_name="Ana",
            last_name="Student",
        )
        self.student_user.role = "STUDENT"
        self.student_user.save()
        self.student = Student.objects.create(student_id=self.student_user)

        self.lesson = Lesson.objects.create(
            instructor_id=self.inst_a,
            subject=self.subject,
            is_available=True,
            status="ACTIVE",
            max_students=1,
        )

        self.attendance = Attendance.objects.create(
            lesson=self.lesson,
            student=self.student,
            call_ended=False,
        )

        # Endpoint i payload za upload sazetka
        self.url = f"/api/lesson/{self.lesson.lesson_id}/summary/"
        self.payload = {
            "file_url": "https://example.com/summary.pdf",
            "file_name": "summary.pdf",
        }

    def test_instructor_summary_upload_flow(self):
        # Upload nije dozvoljen prije zavrsetka poziva
        self.client.force_authenticate(user=self.inst_a_user)

        response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Summary.objects.count(), 0)

        # Nakon zavrsetka poziva upload je dozvoljen
        self.attendance.call_ended = True
        self.attendance.save(update_fields=["call_ended"])

        response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Summary.objects.count(), 1)

        summary = Summary.objects.first()
        self.assertEqual(summary.lesson, self.lesson)
        self.assertEqual(summary.author, self.inst_a)

        # Dupli upload za isti termin nije dozvoljen
        response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Summary.objects.count(), 1)

        # Drugi instruktor nema pravo na upload
        self.client.force_authenticate(user=self.inst_b_user)
        response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, 403)
