from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import Student, Instructor, Subject

User = get_user_model()

#Testira endpoint za ažuriranje studentskog profila (/api/student/me/).
class StudentUpdateEndpointTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/student/me/"

        self.user = User.objects.create_user(
            email="student@test.com",
            first_name="Stud",
            last_name="User",
            password="StrongPass123!"
        )
        self.user.role = User.Role.STUDENT
        self.user.save()

        self.instructors = []
        for i in range(3):
            instr_user = User.objects.create_user(
                email=f"instr{i}@test.com",
                first_name=f"Instr{i}",
                last_name="User",
                password="StrongPass123!"
            )
            instr_user.role = User.Role.INSTRUCTOR
            instr_user.save()
            instr = Instructor.objects.create(instructor_id=instr_user, price=100)
            self.instructors.append(instr)

    #Provjerava da student može uspješno ažurirati sve polja svog profila.
    def test_student_can_update_profile_successfully(self):
        self.client.force_authenticate(user=self.user)

        data = {
            "school_level": "osnovna",
            "grade": 8,
            "knowledge_level": [
                {"subject": "Matematika", "level": "dobra"},
                {"subject": "Fizika", "level": "vrlo dobra"}
            ],
            "learning_goals": "Postati bolji u matematici i fizici",
            "preferred_times": [
                {"day": "Ponedjeljak", "start": "10:00", "end": "12:00"},
                {"day": "Srijeda", "start": "14:00", "end": "16:00"}
            ],
            "notifications_enabled": True,
            "favorite_instructors": [i.instructor_id_id for i in self.instructors],
            "profile_image_url": "https://example.com/student.jpg"
        }

        response = self.client.post(self.url, data, format="json")
        self.assertIn(response.status_code, [200, 201])

        student = Student.objects.get(student_id=self.user)
        self.assertEqual(student.school_level, data["school_level"])
        self.assertEqual(student.grade, data["grade"])
        self.assertEqual(student.knowledge_level, data["knowledge_level"])
        self.assertEqual(student.learning_goals, data["learning_goals"])
        self.assertEqual(student.preferred_times, data["preferred_times"])
        self.assertEqual(student.notifications_enabled, data["notifications_enabled"])
        self.assertEqual(list(student.favorite_instructors.values_list("instructor_id", flat=True)),
                         data["favorite_instructors"])
        self.assertEqual(student.profile_image_url, data["profile_image_url"])

    #Provjerava da korisnici koji nisu studenti (npr. instruktori) ne mogu ažurirati studentski profil.
    #Endpoint vraća HTTP 403 Forbidden.
    def test_non_student_cannot_update_profile(self):
        other_user = User.objects.create_user(
            email="instr_non@test.com",
            first_name="Instr",
            last_name="Non",
            password="StrongPass123!"
        )
        other_user.role = User.Role.INSTRUCTOR
        other_user.save()

        self.client.force_authenticate(user=other_user)

        data = {"school_level": "osnovna"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, 403)

    #Provjerava da je moguće ažurirati samo neka polja (partial update).
    #Nepromenjena polja ostaju na zadanim ili praznim vrijednostima.
    def test_partial_update_fields(self):
        self.client.force_authenticate(user=self.user)

        data = {"learning_goals": "Fokus na fiziku"}
        response = self.client.post(self.url, data, format="json")
        self.assertIn(response.status_code, [200, 201])

        student = Student.objects.get(student_id=self.user)
        self.assertEqual(student.learning_goals, data["learning_goals"])
        self.assertEqual(student.grade, None)
        self.assertEqual(student.school_level, None)
        self.assertEqual(student.knowledge_level, [])
        self.assertEqual(student.preferred_times, [])
        self.assertEqual(student.notifications_enabled, False)
        self.assertEqual(list(student.favorite_instructors.all()), [])
