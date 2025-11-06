from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
    
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        null=True,
        blank=True
    )
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    email = models.EmailField(unique=True, blank=False)

    @property
    def has_role(self):
        return self.role is not None


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
if created:
    Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
