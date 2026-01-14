from datetime import timedelta, datetime
from datetime import timezone as dt_timezone

from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction

from api.models import Attendance


def send_24h_lesson_reminders():
    print(">>> REMINDER JOB STARTED")

    now = timezone.now()  # UTC

    window_24h_start = now + timedelta(hours=23)
    window_24h_end = now + timedelta(hours=25)

    window_1h_start = now + timedelta(minutes=50)
    window_1h_end = now + timedelta(minutes=70)

    attendances = Attendance.objects.select_related(
        "lesson",
        "student",
        "lesson__instructor_id",
        "lesson__instructor_id__instructor_id",
        "student__student_id",
    )

    for att in attendances:
        print(f">>> CHECK ATTENDANCE {att.id}")

        lesson = att.lesson
        if not lesson.date or not lesson.time:
            print(">>> SKIP (no date/time)")
            continue

        lesson_local = timezone.make_aware(
            datetime.combine(lesson.date, lesson.time),
            timezone.get_current_timezone(),
        )
        lesson_utc = lesson_local.astimezone(dt_timezone.utc)

        # =====================================================
        # 24H REMINDER
        # =====================================================
        if window_24h_start <= lesson_utc <= window_24h_end:
            try:
                with transaction.atomic():
                    att_locked = Attendance.objects.select_for_update().get(id=att.id)

                    if att_locked.reminder_sent:
                        print(f">>> 24H ALREADY SENT for {att.id}")
                        continue

                    print(f">>> SENDING 24H MAIL for {att.id}")

                    # student
                    send_mail(
                        "Podsjetnik: termin za 24 sata",
                        (
                            f"Pozdrav {att_locked.student.student_id.first_name},\n\n"
                            f"Imaš termin:\n"
                            f"{lesson.subject}\n"
                            f"{lesson.date} u {lesson.time}.\n\n"
                            f"INFIMA"
                        ),
                        settings.DEFAULT_FROM_EMAIL,
                        [att_locked.student.student_id.email],
                        fail_silently=False,
                    )

                    # instruktor
                    send_mail(
                        "Podsjetnik: termin sutra",
                        (
                            f"Sutra imaš termin sa studentom "
                            f"{att_locked.student.student_id.first_name} "
                            f"{att_locked.student.student_id.last_name}.\n\n"
                            f"{lesson.subject}\n"
                            f"{lesson.date} u {lesson.time}."
                        ),
                        settings.DEFAULT_FROM_EMAIL,
                        [att_locked.lesson.instructor_id.instructor_id.email],
                        fail_silently=False,
                    )

                    att_locked.reminder_sent = True
                    att_locked.save(update_fields=["reminder_sent"])

                    print(f">>> 24H MARKED AS SENT for {att.id}")

            except Exception as e:
                print("!!! EMAIL ERROR 24H:", e)

        # =====================================================
        # 1H REMINDER
        # =====================================================
        if window_1h_start <= lesson_utc <= window_1h_end:
            try:
                with transaction.atomic():
                    att_locked = Attendance.objects.select_for_update().get(id=att.id)

                    if att_locked.reminder_1h_sent:
                        print(f">>> 1H ALREADY SENT for {att.id}")
                        continue

                    print(f">>> SENDING 1H MAIL for {att.id}")

                    # student
                    send_mail(
                        "Podsjetnik: termin za 1 sat",
                        (
                            f"Pozdrav {att_locked.student.student_id.first_name},\n\n"
                            f"Tvoj termin počinje za 1 sat.\n\n"
                            f"{lesson.subject}\n"
                            f"{lesson.time}\n\n"
                            f"INFIMA"
                        ),
                        settings.DEFAULT_FROM_EMAIL,
                        [att_locked.student.student_id.email],
                        fail_silently=False,
                    )

                    # instruktor
                    send_mail(
                        "Podsjetnik: termin za 1 sat",
                        (
                            f"Za 1 sat imaš termin sa studentom "
                            f"{att_locked.student.student_id.first_name} "
                            f"{att_locked.student.student_id.last_name}.\n\n"
                            f"{lesson.subject}\n"
                            f"{lesson.time}."
                        ),
                        settings.DEFAULT_FROM_EMAIL,
                        [att_locked.lesson.instructor_id.instructor_id.email],
                        fail_silently=False,
                    )

                    att_locked.reminder_1h_sent = True
                    att_locked.save(update_fields=["reminder_1h_sent"])

                    print(f">>> 1H MARKED AS SENT for {att.id}")

            except Exception as e:
                print("!!! EMAIL ERROR 1H:", e)

    print(">>> REMINDER JOB FINISHED")
