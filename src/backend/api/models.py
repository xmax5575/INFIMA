from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager, PermissionsMixin
from datetime import date, datetime

# --- CUSTOM USER MODEL ---

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


class User(AbstractUser, PermissionsMixin):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
        ADMIN = 'ADMIN', 'Administrator'
    
    id = models.AutoField(primary_key=True)
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

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def has_role(self):
        """True if the role is set (not None or empty)."""
        return bool(self.role)


# --- SUBJECTS ---

class Subject(models.Model):
    subject_id = models.AutoField(primary_key=True)
    name = models.TextField(unique=True)

    def __str__(self):
        return self.name


# --- PROFILES ---

class Instructor(models.Model):
    instructor_id = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    bio = models.TextField(null=True, blank=True)
    location = models.TextField(null=True, blank=True)
    price = models.IntegerField()
    rating = models.IntegerField(null=True, blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Instructor: {self.instructor_id.first_name} {self.instructor_id.last_name}"


class Student(models.Model):
    student_id = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    grade = models.IntegerField()
    knowledge_level = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Student: {self.student_id.first_name} {self.student_id.last_name}"


class Review(models.Model):
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)


# --- LESSONS AND PAYMENTS ---

class Lesson(models.Model):
    class Level(models.TextChoices):
        ELEMENTARY = 'OSNOVNA', 'Osnovna škola'
        HIGH = 'SREDNJA', 'Srednja škola'

    lesson_id = models.AutoField(primary_key=True)
    instructor_id = models.ForeignKey(Instructor, on_delete=models.CASCADE)
    is_available = models.BooleanField(default=True)
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    location = models.TextField(null=True, blank=True)
    duration_min = models.IntegerField(null=True, blank=True)
    max_students = models.IntegerField(default=1)
    format = models.TextField(null=True, blank=True)  # online / in-person
    price = models.IntegerField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    
    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Lesson with {self.instructor.user.first_name} ({'Free' if self.is_available else 'Booked'})"


class Payment(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE)
    amount = models.IntegerField()
    is_paid = models.BooleanField(default=False)


# --- QUESTIONS AND SUMMARY ---

class Question(models.Model):
    author = models.ForeignKey(Instructor, on_delete=models.SET_NULL, null=True, blank=True)
    difficulty = models.TextField()  # easy, medium, hard
    text = models.TextField()
    answer = models.TextField()
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)


class Summary(models.Model):
    author = models.ForeignKey(Instructor, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    notes = models.TextField(null=True, blank=True)
    homework = models.TextField(null=True, blank=True)
