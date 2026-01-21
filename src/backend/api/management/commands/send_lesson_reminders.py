from django.core.management.base import BaseCommand
from api.utils1 import send_24h_lesson_reminders

# naredba za slanje podsjetnika za termine
class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        send_24h_lesson_reminders()
