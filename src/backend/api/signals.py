from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from api.models import Attendance

@receiver(post_save, sender=Attendance)
def send_reservation_email(sender, instance, created, **kwargs):
    if not created:
        return

    lesson = instance.lesson
    student = instance.student
    instructor = lesson.instructor_id

    # STUDENT MAIL
    send_mail(
        "Rezervacija termina potvrđena",
        f"Rezervirali ste termin {lesson.subject} {lesson.date} u {lesson.time}.",
        settings.DEFAULT_FROM_EMAIL,
        [student.student_id.email],
        fail_silently=False,
    )

    # INSTRUKTOR MAIL
    send_mail(
        "Novi rezervirani termin",
        f"Student {student.student_id.first_name} {student.student_id.last_name} "
        f"rezervirao je termin {lesson.subject} {lesson.date} u {lesson.time}.",
        settings.DEFAULT_FROM_EMAIL,
        [instructor.instructor_id.email],
        fail_silently=False,
    )
