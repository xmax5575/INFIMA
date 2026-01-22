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
        self.math = Subject.objects.create(name="Matematika")
        self.physics = Subject.objects.create(name="Fizika")
        self.informatics = Subject.objects.create(name="Informatika")

    # * Test za kreiranje true/false pitanja #
    def test_true_false_question_creation(self):
        question = Question.objects.create(
            author=self.instructor,
            subject=self.math,
            school_level="SREDNJA",
            grade=3,
            difficulty="Srednje",
            type=Question.QuestionType.TRUE_FALSE,
            text="Radi li true/false?",
            correct_answer=[True]
        )
        # ? Provjerava je li tip pitanja true/false
        self.assertEqual(question.type, "true_false")
        # ? Provjerava je li tekst pitanja "Radi li ovaj test?"
        self.assertEqual(question.text, "Radi li true/false?")
        # ? Provjerava je li true u tocnim odgovorima
        self.assertIn(True, question.correct_answer)
        # ? Provjerava je li u bazi točno jedno pitanje
        self.assertEqual(Question.objects.count(), 1)

    # * Test za neispravan true/false (ima dva točna odgovora)
    def test_true_false_both_correct(self):
        bad_question = Question(
            author=self.instructor,
            subject=self.math,
            type=Question.QuestionType.TRUE_FALSE,
            text="Loše pitanje s dva točna odgovora...",
            correct_answer=[True, False]
        )

        with self.assertRaises(ValidationError):
            bad_question.full_clean()

    # * Test za kreiranje multiple choice pitanja
    def test_multiple_choice_question_creation(self):
        question = Question.objects.create(
            author=self.instructor,
            subject=self.physics,
            school_level="OSNOVNA",
            grade=4,
            difficulty="Teško",
            type=Question.QuestionType.MULTIPLE_CHOICE,
            text="Radi li multiple choice?",
            options=["Da", "Ne", "Naravno", "Naravno da ne"],
            correct_answer=["Da", "Naravno"]
        )

        # ? Provjerava je li tip pitanja multiple choice
        self.assertEqual(question.type, "multiple_choice")
        # ? Provjerava je li tekst pitanja "Radi li multiple choice?"
        self.assertEqual(question.text, "Radi li multiple choice?")
        # ? Provjerava jesu li točni odgovori dobro postavljeni
        self.assertIn("Da", question.correct_answer)
        self.assertIn("Naravno", question.correct_answer)
        # ? Provjerava je li u bazi točno jedno pitanje
        self.assertEqual(Question.objects.count(), 1)

    # * Test u kojem je subject u questionu nevaljan field
    def test_question_wrong_subject(self):
        with self.assertRaises(Exception):
            Question.objects.create(
                author=self.instructor,
                subject="kriv subject field",
                type=Question.QuestionType.TRUE_FALSE,
                text="Loše pitanje s dva točna odgovora...",
                correct_answer=[True, False]
            )