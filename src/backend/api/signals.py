from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction

from api.models import Attendance
from api.utils.mail import send_email


@receiver(post_save, sender=Attendance)
def send_reservation_emails(sender, instance, created, **kwargs):
    if not created:
        return

    def _send():
        lesson = instance.lesson
        student = instance.student
        instructor = lesson.instructor_id

        print(f">>> RESERVATION MAIL FOR ATTENDANCE {instance.id}")

        # STUDENT
        send_email(
            to_email=student.student_id.email,
            subject="Rezervacija termina potvrđena",
            content=(
                f"Pozdrav {student.student_id.first_name},\n\n"
                f"Uspješno si rezervirala termin.\n\n"
                f"Predmet: {lesson.subject}\n"
                f"Datum: {lesson.date}\n"
                f"Vrijeme: {lesson.time}\n\n"
                f"INFIMA"
            ),
        )

        # INSTRUKTOR
        send_email(
            to_email=instructor.instructor_id.email,
            subject="Novi rezervirani termin",
            content=(
                f"Student {student.student_id.first_name} "
                f"{student.student_id.last_name} "
                f"rezervirao je termin.\n\n"
                f"Predmet: {lesson.subject}\n"
                f"Datum: {lesson.date}\n"
                f"Vrijeme: {lesson.time}\n\n"
                f"INFIMA"
            ),
        )

    transaction.on_commit(_send)
