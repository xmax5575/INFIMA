from django.core.management.base import BaseCommand
from api.utils1 import send_24h_lesson_reminders

class Command(BaseCommand):
    help = "Send lesson reminders"

    def handle(self, *args, **kwargs):
        print(">>> MANAGEMENT COMMAND STARTED")
        send_24h_lesson_reminders()
        self.stdout.write(">>> Reminder check done")