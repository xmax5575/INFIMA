from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager, PermissionsMixin
from datetime import date, datetime
from django.utils import timezone

# klasa za upravljanje stavki korisnika
class UserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, role=None, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, first_name=first_name, last_name=last_name, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        user = self.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role='ADMIN',
            password=password,
            **extra_fields
        )
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

# model koji predstavlja korisnika u bazi podataka, nasljeđuje AbstractUser i PermissionsMixin zbog autentifikacije Djanga
class User(AbstractUser, PermissionsMixin):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
        ADMIN = 'ADMIN', 'Administrator'
    
    id = models.AutoField(primary_key=True) # primarni ključ 
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)

    role = models.CharField(
        max_length=15,
        choices=Role.choices,
        null=True,
        blank=True
    )

    email = models.EmailField(unique=True, blank=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager() # povezuje model s UserManagerom

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
   
    # metoda koja vraća True ako korisnik ima postavljenu ulogu
    @property
    def has_role(self):
        return bool(self.role)

# model koji predstavlja predmet u bazi podataka
class Subject(models.Model):
    subject_id = models.AutoField(primary_key=True) # primarni ključ 
    name = models.TextField(unique=True)

# model koji predstavlja instruktora u bazi podataka
class Instructor(models.Model):
    instructor_id = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True) # ako se obriše korsnik, briše se i instruktor, primarni ključ
    bio = models.TextField(null=True, blank=True)
    location = models.TextField(null=True, blank=True)
    price = models.IntegerField()
    rating = models.FloatField(null=True, blank=True)
    subjects = models.ManyToManyField(Subject, blank=True, related_name="instructors")
    profile_image_url = models.URLField(null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)  
    google_calendar_email = models.EmailField(null=True, blank=True)
    google_refresh_token = models.TextField(null=True, blank=True)
    
class Student(models.Model):
    student_id = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True) # ako se obriše korisnik, briše se i student, primarni ključ
    school_level = models.CharField(max_length=20, null=True, blank=True)
    grade = models.IntegerField(null=True, blank=True)
    knowledge_level = models.JSONField(default=list, blank=True)
    learning_goals = models.TextField(null=True, blank=True)
    preferred_times = models.JSONField(default=list, blank=True)
    notifications_enabled = models.BooleanField(default=False)
    favorite_instructors = models.ManyToManyField(Instructor, blank=True, related_name="favorited_by")
    profile_image_url = models.URLField(null=True, blank=True)

# model koji predstavlja recenzije u bazi podataka
class Review(models.Model):
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE) # strani ključ
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True) # strani ključ
    rating = models.FloatField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

# model koji predstavlja termine u bazi podataka
class Lesson(models.Model):
    class Level(models.TextChoices):
        ELEMENTARY = 'OSNOVNA', 'Osnovna škola'
        HIGH = 'SREDNJA', 'Srednja škola'

    lesson_id = models.AutoField(primary_key=True)
    instructor_id = models.ForeignKey(Instructor, on_delete=models.CASCADE, db_column='instructor_id' ) # ako se obriše instruktor, brišu se i svi njegovi termini, strani ključ
    is_available = models.BooleanField(default=True)
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True) # strani ključ
    location = models.TextField(null=True, blank=True)
    duration_min = models.IntegerField(null=True, blank=True)
    max_students = models.IntegerField(default=1)
    format = models.TextField(null=True, blank=True) 
    price = models.IntegerField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    google_event_id = models.CharField(max_length=255, null=True, blank=True)
    
    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        null=True,
        blank=True
    )

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Aktivan"
        EXPIRED = "EXPIRED", "Istekao"
        CANCELED = "CANCELED", "Otkazan"

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    jitsi_room = models.CharField(max_length=255, blank=True, null=True)

# model koji predstavlja status prisutnosti u bazi podataka
class Attendance(models.Model):
    # ako se termin ili student obrišu, briše se i status prisutnosti
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE) # strani ključ
    student = models.ForeignKey(Student, on_delete=models.CASCADE) # strani ključ
    attended = models.BooleanField(default=False)  
    reminder_sent = models.BooleanField(default=False)
    reminder_1h_sent = models.BooleanField(default=False)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    call_ended = models.BooleanField(default=False)
    review_done = models.BooleanField(default=False)


    class Meta:
        unique_together = ("lesson", "student")

# model koji predstavlja plaćanje u bazi podataka
class Payment(models.Model):
    attendance = models.OneToOneField(Attendance, on_delete=models.CASCADE, null=True, blank=True) # strani ključ
    amount = models.IntegerField()
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

# model koji predstavlja pitanja u bazi podataka
class Question(models.Model):
    class QuestionType(models.TextChoices):
        TRUE_FALSE = "true_false", "True / False"
        MULTIPLE_CHOICE = "multiple_choice", "Multiple Choice"
        SHORT_ANSWER = "short_answer", "Short answer"

    author = models.ForeignKey(Instructor, on_delete=models.CASCADE, related_name="questions") # strani ključ
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE) # strani ključ
    school_level = models.CharField(max_length=20)
    grade = models.IntegerField()
    difficulty = models.CharField(max_length=50)
    type = models.CharField(max_length=30, choices=QuestionType.choices)
    text = models.TextField()
    points = models.IntegerField(default=1)
    options = models.JSONField(default=list, blank=True)  
    correct_answer = models.JSONField(default=list)

# model koji predstavlja sažetak u bazi podataka
class Summary(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name="summary") # strani ključ
    author = models.ForeignKey(Instructor, on_delete=models.CASCADE) # strani ključ
    file_url = models.URLField()
    file_name = models.CharField(max_length=255) 