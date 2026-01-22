from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import Subject, Instructor

User = get_user_model()

class InstructorUpdateEndpointTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/instructor/me/"

        self.user = User.objects.create_user(
            email="instr@test.com",
            first_name="Instr",
            last_name="User",
            password="StrongPass123!"
        )
        self.user.role = User.Role.INSTRUCTOR
        self.user.save()

        self.subjects = []
        for name in ["Matematika", "Fizika", "Informatika"]:
            subj = Subject.objects.create(name=name)
            self.subjects.append(subj)

    def test_instructor_can_update_profile_successfully(self):
        self.client.force_authenticate(user=self.user)

        data = {
            "bio": "I teach awesome subjects",
            "location": "Zagreb, Croatia",
            "price": 150,
            "subjects": [s.name for s in self.subjects],
            "profile_image_url": "https://example.com/image.jpg",
            "video_url": "https://youtube.com/samplevideo"
        }

        response = self.client.post(self.url, data, format="json")
        self.assertIn(response.status_code, [200, 201])

        instructor = Instructor.objects.get(instructor_id=self.user)
        self.assertEqual(instructor.bio, data["bio"])
        self.assertEqual(instructor.location, data["location"])
        self.assertEqual(instructor.price, data["price"])
        self.assertEqual(set(instructor.subjects.values_list('name', flat=True)),
                         set([s.name for s in self.subjects]))
        self.assertEqual(instructor.profile_image_url, data["profile_image_url"])
        self.assertEqual(instructor.video_url, data["video_url"])

    def test_cannot_add_more_than_three_subjects(self):
        self.client.force_authenticate(user=self.user)

        extra_subject = Subject.objects.create(name="Chemija")
        data = {
            "subjects": [s.name for s in self.subjects] + [extra_subject.name]
        }

        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, 400)

    def test_non_instructor_cannot_update_profile(self):
        student = User.objects.create_user(
            email="student@test.com",
            first_name="Stud",
            last_name="User",
            password="StrongPass123!"
        )
        student.role = User.Role.STUDENT
        student.save()

        self.client.force_authenticate(user=student)

        data = {"bio": "Trying to hack"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_partial_update_fields(self):
        self.client.force_authenticate(user=self.user)

        data = {
            "bio": "Partial update only bio"
        }

        response = self.client.post(self.url, data, format="json")
        self.assertIn(response.status_code, [200, 201])

        instructor = Instructor.objects.get(instructor_id=self.user)
        self.assertEqual(instructor.bio, data["bio"])
        self.assertEqual(instructor.price, 0)
        self.assertEqual(list(instructor.subjects.all()), [])
