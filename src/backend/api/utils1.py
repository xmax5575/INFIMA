from datetime import timedelta, datetime
from datetime import timezone as dt_timezone
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from api.models import Attendance
import time

def send_24h_lesson_reminders():
    now = timezone.now()  # UTC

    window_24h_start = now + timedelta(hours=23)
    window_24h_end = now + timedelta(hours=25)

    window_1h_start = now + timedelta(minutes=50)
    window_1h_end = now + timedelta(minutes=70)

    attendances = Attendance.objects.select_related(
        "lesson",
        "student",
        "lesson__instructor_id"
    )

    for att in attendances:
        lesson = att.lesson

        if not lesson.date or not lesson.time:
            continue

        lesson_local = timezone.make_aware(
            datetime.combine(lesson.date, lesson.time),
            timezone.get_current_timezone()
        )

        lesson_utc = lesson_local.astimezone(dt_timezone.utc)

        hours_to_lesson = (lesson_utc - now).total_seconds() / 3600

        # ===== 24H REMINDER =====
        if not att.reminder_sent:
            if window_24h_start <= lesson_utc <= window_24h_end:
                try:
                    send_mail(
                        "Podsjetnik: termin za 24 sata",
                        f"Imaš termin {lesson.subject} "
                        f"{lesson.date} u {lesson.time}.",
                        settings.DEFAULT_FROM_EMAIL,
                        [att.student.student_id.email],
                        fail_silently=False,
                    )
                    time.sleep(2)
                    send_mail(
                        "Podsjetnik: termin sutra",
                        f"Sutra imaš termin sa studentom "
                        f"{att.student.student_id.first_name} "
                        f"{att.student.student_id.last_name}.",
                        settings.DEFAULT_FROM_EMAIL,
                        [lesson.instructor_id.instructor_id.email],
                        fail_silently=False,
                    )
                    time.sleep(2)
                    att.reminder_sent = True
                    att.save(update_fields=["reminder_sent"])

                except Exception as e:
                    print("EMAIL ERRORbbb:", e)

        # ===== 1H REMINDER =====
        if not att.reminder_1h_sent:
            if window_1h_start <= lesson_utc <= window_1h_end:
                try:
                    send_mail(
                        "Podsjetnik: termin za 1 sat",
                        f"Termin {lesson.subject} počinje za 1 sat "
                        f"({lesson.time}).",
                        settings.DEFAULT_FROM_EMAIL,
                        [att.student.student_id.email],
                        fail_silently=False,
                    )
                    time.sleep(2)
                    send_mail(
                        "Podsjetnik: termin za 1 sat",
                        f"Za 1 sat imaš termin sa studentom "
                        f"{att.student.student_id.first_name} "
                        f"{att.student.student_id.last_name}.",
                        settings.DEFAULT_FROM_EMAIL,
                        [lesson.instructor_id.instructor_id.email],
                        fail_silently=False,
                    )
                    time.sleep(2)
                    att.reminder_1h_sent = True
                    att.save(update_fields=["reminder_1h_sent"])

                except Exception as e:
                    print("EMAIL ERRORbbb:", e)
