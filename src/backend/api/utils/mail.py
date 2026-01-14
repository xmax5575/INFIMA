from django.core.mail import send_mail
from django.conf import settings
import logging
import time
logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, content: str):
    try:
        send_mail(
            subject=subject,
            message=content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        time.sleep(2)
    except Exception as e:
        # 🔥 mail je failed, ali APP NASTAVLJA RADITI
        logger.error("EMAIL FAILED (ignored): %s", e)
