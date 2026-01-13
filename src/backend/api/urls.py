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
    # Endpoint za cancel termmina za instrukcije
    path("lessons/cancel/", views.CancelLessonView.as_view()),
    
    path("lessons/<int:lesson_id>/jitsi/", views.LessonJitsiRoomView.as_view()),

    path("lessons/<int:lesson_id>/jaas-token/", views.LessonJaasTokenView.as_view()),

    path("lessons/<int:lesson_id>/end/", views.EndLessonView.as_view(), name="lesson-end"),

    path("payments/<int:lesson_id>/confirm/", views.ConfirmPaymentView.as_view(), name="payment-confirm"),

    path("reviews/<int:lesson_id>/submit/", views.SubmitReviewView.as_view(), name="review-submit"),
    # Endpoint za dohvacanje recenzija logiranog instruktora
    path("instructor/reviews/my/",views.MyInstructorReviewsView.as_view(), name="my-instructor-reviews" ),
    # Endpoint za dohvacanje recenzija po instruktor id
    path("instructor/reviews/<int:pk>/", views.InstructorReviewsView.as_view(), name="instructor-reviews"),
    # Endpoint za brisanje termina
    path("termin/delete/<int:lesson_id>/", views.LessonDeleteView.as_view(), name="termin-delete"),

    path("instructor/questions/upload/", views.InstructorQuestionUploadView.as_view(), name="instructor-question-upload"),
]