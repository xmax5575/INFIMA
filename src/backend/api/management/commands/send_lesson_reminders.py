from django.core.management.base import BaseCommand
from backend.api.utils2 import send_24h_lesson_reminders

class Command(BaseCommand):
    help = "Send lesson reminders 24h before"

    def handle(self, *args, **kwargs):
        send_24h_lesson_reminders()
        self.stdout.write("Reminder check done.")
