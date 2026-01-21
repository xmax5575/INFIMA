from django.core.management.base import BaseCommand
from backend.api.utils1 import send_lesson_reminders

# naredba za slanje podsjetnika za termine
class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        send_lesson_reminders()
