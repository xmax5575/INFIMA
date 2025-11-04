from django.dispatch import receiver
from allauth.account.signals import user_logged_in
from rest_framework_simplejwt.tokens import RefreshToken

@receiver(user_logged_in)
def generate_jwt_on_login(sender, request, user, **kwargs):
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token
