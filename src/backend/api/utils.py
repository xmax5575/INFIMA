from datetime import timedelta, datetime
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from api.models import Attendance

def send_24h_lesson_reminders():
    now = timezone.now()

    start = now + timedelta(hours=23, minutes=45)
    end = now + timedelta(hours=24, minutes=15)

    attendances = Attendance.objects.filter(reminder_sent=False)

    for att in attendances:
        lesson = att.lesson

        if not lesson.date or not lesson.time:
            continue

        lesson_dt = timezone.make_aware(
            datetime.combine(lesson.date, lesson.time)
        )

        if start <= lesson_dt <= end:
            student = att.student.student_id
            instructor = lesson.instructor_id.instructor_id

            # student mail
            send_mail(
                "Podsjetnik: termin za 24 sata",
                f"Imaš termin {lesson.subject} "
                f"{lesson.date} u {lesson.time}.",
                settings.DEFAULT_FROM_EMAIL,
                [student.email],
                fail_silently=False,
            )

            # instructor mail
            send_mail(
                "Podsjetnik: termin sutra",
                f"Sutra imaš termin sa studentom "
                f"{student.first_name} {student.last_name}.",
                settings.DEFAULT_FROM_EMAIL,
                [instructor.email],
                fail_silently=False,
            )

            att.reminder_sent = True
            att.save(update_fields=["reminder_sent"])
