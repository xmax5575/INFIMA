from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models import Attendance
from api.utils.mail import send_email


@receiver(post_save, sender=Attendance)
def send_reservation_email(sender, instance, created, **kwargs):
    if not created:
        return

    lesson = instance.lesson
    student = instance.student
    instructor = lesson.instructor_id

    print("SENDING MAIL TO STUDENT:", student.student_id.email)
    print("SENDING MAIL TO INSTRUCTOR:", instructor.instructor_id.email)

    # 📧 MAIL STUDENTU
    send_email(
        to_email=student.student_id.email,
        subject="Rezervacija termina potvrđena",
        content=(
            f"Pozdrav {student.student_id.first_name},\n\n"
            f"Uspješno ste rezervirali termin.\n\n"
            f"Predmet: {lesson.subject}\n"
            f"Datum: {lesson.date}\n"
            f"Vrijeme: {lesson.time}\n\n"
            f"Vidimo se!\n"
            f"Infima Instrukcije"
        ),
    )

    # 📧 MAIL INSTRUKTORU
    send_email(
        to_email=instructor.instructor_id.email,
        subject="Novi rezervirani termin",
        content=(
            f"Student {student.student_id.first_name} "
            f"{student.student_id.last_name} "
            f"rezervirao je novi termin.\n\n"
            f"Predmet: {lesson.subject}\n"
            f"Datum: {lesson.date}\n"
            f"Vrijeme: {lesson.time}\n"
        ),
    )
