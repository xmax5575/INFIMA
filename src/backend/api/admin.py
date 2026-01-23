from django.contrib import admin
from .models import (
    User,
    Subject,
    Instructor,
    Student,
    Review,
    Lesson,
    Attendance,
    Payment,
    Question,
    Summary
)

# registracija svih modela za Django admina
admin.site.register(User)
admin.site.register(Subject)
admin.site.register(Instructor)
admin.site.register(Student)
admin.site.register(Review)
admin.site.register(Lesson)
admin.site.register(Attendance)
admin.site.register(Payment)
admin.site.register(Question)
admin.site.register(Summary)