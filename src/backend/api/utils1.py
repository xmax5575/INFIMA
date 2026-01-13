from datetime import timedelta, datetime
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from api.models import Attendance
<<<<<<< Updated upstream


def send_24h_lesson_reminders():
    print(">>> POZVAN SEND_REMINDERS")

    now = timezone.now()

    # SIGURAN WINDOW (tolerantan na kašnjenja)
    start = now + timedelta(hours=23)
    end = now + timedelta(hours=25)

    attendances = Attendance.objects.filter(reminder_sent=False)
=======
import pytz
from datetime import timezone as dt_timezone

def send_24h_lesson_reminders():
    now = timezone.now()

    # ŠIRI PROZOR (sigurno hvata)
    window_start = now + timedelta(hours=23)
    window_end = now + timedelta(hours=25)

    zagreb_tz = pytz.timezone("Europe/Zagreb")

    attendances = Attendance.objects.filter(
        reminder_sent=False
    ).select_related("lesson", "student", "lesson__instructor_id")
>>>>>>> Stashed changes

    for att in attendances:
        lesson = att.lesson

        if not lesson.date or not lesson.time:
            continue

<<<<<<< Updated upstream
        # ISPRAVNO aware datetime (bez timezone bugova)
        lesson_dt = timezone.make_aware(
            datetime.combine(lesson.date, lesson.time),
            timezone.get_current_timezone()
        )

        # DEBUG ISPIS (možeš kasnije maknuti)
        print("NOW:", now)
        print("WINDOW:", start, "->", end)
        print("LESSON:", lesson_dt)
        print("REMINDER_SENT:", att.reminder_sent)

        if start <= lesson_dt <= end:
            student = att.student.student_id
            instructor = lesson.instructor_id.instructor_id

            print(">>> TREBA POSLATI REMINDER ZA:", lesson_dt)

            mail_sent = True

            try:
                # STUDENT MAIL
                send_mail(
                    "Podsjetnik: termin za 24 sata",
                    f"Imaš termin {lesson.subject} "
                    f"{lesson.date} u {lesson.time}.",
                    settings.DEFAULT_FROM_EMAIL,
                    [student.email],
                    fail_silently=False,
                )

                # INSTRUCTOR MAIL
                send_mail(
                    "Podsjetnik: termin sutra",
                    f"Sutra imaš termin sa studentom "
                    f"{student.first_name} {student.last_name}.",
                    settings.DEFAULT_FROM_EMAIL,
                    [instructor.email],
                    fail_silently=False,
                )

            except Exception as e:
                mail_sent = False
                print("!!! MAIL FAIL:", e)

            # FLAG POSTAVLJAMO SAMO AKO JE MAIL USPJEŠNO POSLAN
            if mail_sent:
                att.reminder_sent = True
                att.save(update_fields=["reminder_sent"])
                print(">>> REMINDER POSLAN I OZNAČEN")
            else:
                print(">>> REMINDER NIJE POSLAN – FLAG OSTAO FALSE")

    print(">>> Reminder check done.")
=======
        # EXPLICITNA TIMEZONE (FIX)
        naive_dt = datetime.combine(lesson.date, lesson.time)
        lesson_dt = zagreb_tz.localize(naive_dt)

        # PRETVORI U UTC radi usporedbe
        lesson_dt = lesson_dt.astimezone(dt_timezone.utc)
        print("NOW:", now)
        print("LESSON:", lesson_dt)

        if window_start <= lesson_dt <= window_end:
            student = att.student.student_id
            instructor = lesson.instructor_id.instructor_id

            send_mail(
                "Podsjetnik: termin sutra",
                f"Imaš termin {lesson.subject} "
                f"{lesson.date} u {lesson.time}.",
                settings.DEFAULT_FROM_EMAIL,
                [student.email],
            )

            send_mail(
                "Podsjetnik: termin sutra",
                f"Sutra imaš termin sa studentom "
                f"{student.first_name} {student.last_name}.",
                settings.DEFAULT_FROM_EMAIL,
                [instructor.email],
            )

            att.reminder_sent = True
            att.save(update_fields=["reminder_sent"])
>>>>>>> Stashed changes
