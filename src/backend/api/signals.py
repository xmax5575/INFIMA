from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models import Attendance
from api.utils.mail import send_email
import threading
import time


@receiver(post_save, sender=Attendance)
def send_reservation_email(sender, instance, created, **kwargs):

    if not created:
        return

    lesson = instance.lesson
    student = instance.student
    instructor = lesson.instructor_id

    def send_emails_task():
        try:
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

            # ⏱️ MALI DELAY (KLJUČNO)
            time.sleep(3)

            # 📧 MAIL INSTRUKTORU
            send_email(
                to_email=instructor.instructor_id.email,
                subject="Novi rezervirani termin",
                content=(
                    f"Student {student.student_id.first_name} {student.student_id.last_name} "
                    f"rezervirao je novi termin.\n\n"
                    f"Predmet: {lesson.subject}\n"
                    f"Datum: {lesson.date}\n"
                    f"Vrijeme: {lesson.time}\n"
                ),
            )
        except Exception as e:
            None
    

    threading.Thread(target=send_emails_task).start()
