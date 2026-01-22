import requests
from django.conf import settings

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

# šalje mail koristeći Brevo API
def send_email(to_email: str, subject: str, content: str) -> None:
    # podatci koje šaljemo Brevo API-ju
    payload = {
        "sender": {
            "email": settings.DEFAULT_FROM_EMAIL,
            "name": "INFIMA"
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "textContent": content,
    }

    # šaljemo Brevo API-ju format u kojem će mu doći podatci
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

    # ako je uspješno poslan mail Brevo šalje 200, 201 ili 202
    if response.status_code not in (200, 201, 202):
        raise Exception(
            f"BREVO API ERROR {response.status_code}: {response.text}"
        )