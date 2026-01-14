import requests
from django.conf import settings

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_email(to_email: str, subject: str, content: str) -> None:
    payload = {
        "sender": {
            "email": settings.DEFAULT_FROM_EMAIL,
            "name": "INFIMA"
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "textContent": content,
    }

    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }

    response = requests.post(
        BREVO_API_URL,
        json=payload,
        headers=headers,
        timeout=10,
    )

    if response.status_code not in (200, 201, 202):
        raise Exception(
            f"BREVO API ERROR {response.status_code}: {response.text}"
        )
