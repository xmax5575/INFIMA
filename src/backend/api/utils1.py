from datetime import datetime, timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from api.models import Attendance, Lesson
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


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
                f"Imaš termin {lesson.subject.name if lesson.subject else ''} "
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