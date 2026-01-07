from django.urls import path
from . import views

urlpatterns = [
    # Endpoint za prikaz svih lekcija i kreiranje nove lekcije (GET i POST)
    path('lessons/', views.LessonListCreateView.as_view(), name='lesson-list'),
    # Endpoint za dohvat, ažuriranje ili brisanje pojedine lekcije prema ID-u (GET, PUT/PATCH, DELETE)
    path('lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson-detail'),
    # Endpoint preko kojeg će instruktor uređivati svoj profil
    path('instructor/me/', views.InstructorUpdateView.as_view(), name='instructor-update'),
    # Endpoint za prikaz vlastitog instruktorovog profila
    path("instructor/inf/", views.MyInstructorProfileView.as_view(), name="instructor-inf"),
    # Endpoint za prikaz instruktorovog profila prema ID-u
    path("instructor/<int:pk>/", views.InstructorPublicProfileView.as_view(), name="instructor-detail"),
    # Endpoint za dohvat svih instruktora
    path("instructors/all/", views.InstructorListView.as_view(), name="instructor-list"),
    # Endpoint za prikaz vlastitog učenikovog profila
    path("student/inf/", views.MyStudentProfileView.as_view(), name="student-inf"),
    # Endpoint za prikaz učenikovovg profila prema ID-u
    path("student/<int:pk>/", views.StudentPublicProfileView.as_view(), name="student-detail"),
    
    path('student/me/', views.StudentUpdateView.as_view(), name='student-update'),
    #endpoint za prikaz studentovih lekcija
    path("student/lessons/", views.StudentMyLessonsView.as_view(), name="student_my_lessons"),
    # Endpoint za rezerviranje termina za instrukcije
    path("lessons/reserve/", views.ReserveLessonView.as_view()),
]