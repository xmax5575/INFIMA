from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import Instructor, Subject, Question
from django.core.exceptions import ValidationError

User = get_user_model()

class questionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="question@test.com",
            first_name="Question",
            last_name="Test",
            role="INSTRUCTOR",
            password="Question123"
        )

        self.instructor = Instructor.objects.create(
            instructor_id=self.user,
            price=10,
            bio="Question test instruktor"
        )

        self.subject = Subject.objects.create(name="Matematika")

    # * Test za kreiranje pitanja #
    def test_question_creation_success(self):
        question = Question.objects.create(
            author=self.instructor,
            subject=self.subject,
            school_level="SREDNJA",
            grade=3,
            difficulty="Srednje",
            type=Question.QuestionType.TRUE_FALSE,
            text="Radi li ovaj test?",
            correct_answer=[True]
        )

        # ! Provjerava je li tip pitanja true/false
        self.assertEqual(question.type, "true_false")

        # ! Provjerava je li tekst pitanja "Radi li ovaj test?"
        self.assertEqual(question.text, "Radi li ovaj test?")

        # ! Provjerava je li true u tocnim odgovorima
        self.assertIn(True, question.correct_answer)

        # ! Provjerava je li u bazi točno jedno pitanje
        self.assertEqual(Question.objects.count(), 1)

    # * Test za neispravan true/false (ima dva točna odgovora)
    def test_true_false_both_correct(self):
        bad_question = Question(
            author=self.instructor,
            subject=self.subject,
            type=Question.QuestionType.TRUE_FALSE,
            text="Loše pitanje s dva točna odgovora...",
            correct_answer=[True, False]
        )

        with self.assertRaises(ValidationError):
            bad_question.full_clean()
