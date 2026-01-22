import threading  # koristi se za slanje maila u pozadini
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from api.models import Attendance
from api.utils.mail import send_email

@receiver(post_save, sender=Attendance) # kada se spremi rezervacija u Attendance, automatski se šalju mailovi
def send_reservation_emails(sender, instance, created, **kwargs):
    # ako se nije napravila nova rezervacija, ne događa se ništa
    if not created:
        return

    def _send_logic():
        try:
            lesson = instance.lesson
            student = instance.student
            instructor = lesson.instructor_id

            # mail koji se šalje učeniku
            send_email(
                to_email=student.student_id.email,
                subject="Rezervacija termina potvrđena",
                content=(
                    f"Poštovani/Poštovana "
                    f"{student.student_id.first_name} "
                    f"{student.student_id.last_name},\n\n"
                    f"Ovim putem vas obavještavamo da je vaša rezervacija termina uspješno potvrđena.\n\n"
                    f"Detalji termina:\n"
                    f"Predmet: {lesson.subject.name}\n"
                    f"Datum: {lesson.date}\n"
                    f"Vrijeme: {lesson.time}\n\n"
                    f"Lijep pozdrav,\n"
                    f"INFIMA"
                ),
            )
            
            # mail koji se šalje instrukotru
            send_email(
                to_email=instructor.instructor_id.email,
                subject="Novi rezervirani termin",
                content=(
                    f"Poštovani/Poštovana "
                    f"{instructor.instructor_id.first_name} "
                    f"{instructor.instructor_id.last_name},\n\n"
                    f"Obavještavamo vas da je student "
                    f"{student.student_id.first_name} "
                    f"{student.student_id.last_name} "
                    f"rezervirao termin.\n\n"
                    f"Detalji termina:\n"
                    f"Predmet: {lesson.subject.name}\n"
                    f"Datum: {lesson.date}\n"
                    f"Vrijeme: {lesson.time}\n\n"
                    f"Lijep pozdrav,\n"
                    f"INFIMA"
                ),
            )
        except Exception as e:
             print("Greška prilikom slanja emaila za rezervaciju:", e)

    # funkcija za pokretanje thread-a, odnosno slanje maila u pozadini
    def _start_background_thread():
        thread = threading.Thread(target=_send_logic, daemon=True)  
        thread.start()

    transaction.on_commit(_start_background_thread)  # kada se baza spremi, pokreće se thread