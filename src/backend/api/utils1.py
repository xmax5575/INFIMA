from datetime import timedelta, datetime
from datetime import timezone as dt_timezone

from django.utils import timezone
from django.db import transaction

from api.models import Attendance
from api.utils.mail import send_email
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from api.models import Attendance, Lesson
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def send_24h_lesson_reminders():
    now = timezone.now()

    # vremenski prozori
    window_24h_start = now + timedelta(hours=23)
    window_24h_end = now + timedelta(hours=25)

    window_1h_start = now + timedelta(minutes=50)
    window_1h_end = now + timedelta(minutes=70)

    attendances = Attendance.objects.select_related(
        "lesson",
        "student",
        "student__student_id",
        "lesson__instructor_id",
        "lesson__instructor_id__instructor_id",
    )

    for att in attendances:

        lesson = att.lesson
        if not lesson.date or not lesson.time:
            continue

        lesson_local = timezone.make_aware(
            datetime.combine(lesson.date, lesson.time),
            timezone.get_current_timezone(),
        )
        lesson_utc = lesson_local.astimezone(dt_timezone.utc)

        if window_24h_start <= lesson_utc <= window_24h_end:
            try:
                with transaction.atomic():
                    att_locked = Attendance.objects.select_for_update().get(id=att.id)

                    if att_locked.reminder_sent:
                        print(f">>> 24H ALREADY SENT for {att.id}")
                    else:
                        print(f">>> 📧 SENDING 24H MAIL for {att.id}")

                        # STUDENT
                        send_email(
                            to_email=att_locked.student.student_id.email,
                            subject="Podsjetnik: termin za 24 sata",
                            content=(
                                f"Poštovani/Poštovana "
                                f"{att_locked.student.student_id.first_name} "
                                f"{att_locked.student.student_id.last_name},\n\n"
                                f"Obavještavamo vas da imate zakazane instrukcije "
                                f"iz predmeta {lesson.subject.name} "
                                f"dana {lesson.date} u {lesson.time}.\n\n"
                                f"Lijep pozdrav,\n"
                                f"INFIMA"
                            ),
                        )

                        # INSTRUKTOR
                        send_email(
                            to_email=att_locked.lesson.instructor_id.instructor_id.email,
                            subject="Podsjetnik: termin za 24 sata",
                            content=(
                                f"Poštovani/Poštovana "
                                f"{att_locked.lesson.instructor_id.instructor_id.first_name} "
                                f"{att_locked.lesson.instructor_id.instructor_id.last_name},\n\n"
                                f"Obavještavamo vas da imate zakazane instrukcije "
                                f"sa studentom "
                                f"{att_locked.student.student_id.first_name} "
                                f"{att_locked.student.student_id.last_name} "
                                f"iz predmeta {lesson.subject.name} "
                                f"dana {lesson.date} u {lesson.time}.\n\n"
                                f"Lijep pozdrav,\n"
                                f"INFIMA"
                            ),
                        )

                        att_locked.reminder_sent = True
                        att_locked.save(update_fields=["reminder_sent"])

                        print(f">>> ✅ 24H MARKED AS SENT for {att.id}")
            except Exception as e:
                print("!!! EMAIL ERROR 24H:", e)
        else:
            print(">>> ❌ NOT IN 24H WINDOW")

        if window_1h_start <= lesson_utc <= window_1h_end:
            print(">>> 🔔 MATCH 1H WINDOW")
            try:
                with transaction.atomic():
                    att_locked = Attendance.objects.select_for_update().get(id=att.id)

                    if att_locked.reminder_1h_sent:
                        print(f">>> 1H ALREADY SENT for {att.id}")
                    else:
                        print(f">>> 📧 SENDING 1H MAIL for {att.id}")

                        # STUDENT
                        send_email(
                            to_email=att_locked.student.student_id.email,
                            subject="Podsjetnik: termin za 1 sat",
                            content=(
                                f"Poštovani/Poštovana "
                                f"{att_locked.student.student_id.first_name} "
                                f"{att_locked.student.student_id.last_name},\n\n"
                                f"Podsjećamo vas da imate instrukcije "
                                f"iz predmeta {lesson.subject.name} "
                                f"danas u {lesson.time}.\n\n"
                                f"Lijep pozdrav,\n"
                                f"INFIMA"
                            ),

                        )

                        # INSTRUKTOR
                        send_email(
                            to_email=att_locked.lesson.instructor_id.instructor_id.email,
                            subject="Podsjetnik: termin za 1 sat",
                            content=(
                                f"Poštovani/Poštovana "
                                f"{att_locked.lesson.instructor_id.instructor_id.first_name} "
                                f"{att_locked.lesson.instructor_id.instructor_id.last_name},\n\n"
                                f"Podsjećamo vas da za 1 sat imate zakazane instrukcije "
                                f"sa studentom "
                                f"{att_locked.student.student_id.first_name} "
                                f"{att_locked.student.student_id.last_name} "
                                f"iz predmeta {lesson.subject.name} "
                                f"u {lesson.time}.\n\n"
                                f"Lijep pozdrav,\n"
                                f"INFIMA"
                            ),
                        )

                        att_locked.reminder_1h_sent = True
                        att_locked.save(update_fields=["reminder_1h_sent"])

                        print(f">>> ✅ 1H MARKED AS SENT for {att.id}")
            except Exception as e:
                print("!!! EMAIL ERROR 1H:", e)
        else:
            print(">>> ❌ NOT IN 1H WINDOW")


def create_google_calendar_event(instructor, lesson):
    creds = Credentials(
        token=None,
        refresh_token=instructor.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
    )

    service = build("calendar", "v3", credentials=creds)

    start_dt = timezone.make_aware(
        datetime.combine(lesson.date, lesson.time)
    )
    end_dt = start_dt + timedelta(minutes=lesson.duration_min or 60)

    event = {
        "summary": f"Instrukcije – {lesson.subject.name if lesson.subject else 'Termin'}",
        "location": lesson.location or "",
        "description": (
            f"Instruktor: {lesson.instructor_id.instructor_id.get_full_name()}\n"
            f"Predmet: {lesson.subject.name if lesson.subject else '—'}"
        ),
        "start": {
            "dateTime": start_dt.isoformat(),
            "timeZone": "Europe/Zagreb",
        },
        "end": {
            "dateTime": end_dt.isoformat(),
            "timeZone": "Europe/Zagreb",
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 30},
            ],
        },
    }

    created = service.events().insert(
        calendarId="primary",
        body=event
    ).execute()

    lesson.google_event_id = created["id"]
    lesson.save(update_fields=["google_event_id"])

def sync_existing_lessons_to_google(instructor):
    if not instructor.google_refresh_token:
        return

    lessons = Lesson.objects.filter(
        instructor_id=instructor,
        google_event_id__isnull=True,
        status="ACTIVE",
        date__gte=timezone.now().date(),
    )

    for lesson in lessons:
        create_google_calendar_event(instructor, lesson)
