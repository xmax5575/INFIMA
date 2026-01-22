from django.urls import path
from . import views

urlpatterns = [
    # Endpoint za prikaz svih lekcija i kreiranje nove lekcije (GET i POST)
    path('lessons/', views.LessonListCreateView.as_view(), name='lesson-list'),
    # Endpoint za dohvat, ažuriranje ili brisanje pojedine lekcije prema ID-u (GET, PUT/PATCH, DELETE)
    path('lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson-detail'),
    # Endpoint za kreiranje ili ažuriranje profila logiranog instruktora
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
    # Endpoint za kreiranje ili ažuriranje profila logiranog studenta
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
    # Endpoint koji omogućava instruktorima upload više pitanja odjednom
    path("instructor/questions/upload/", views.InstructorQuestionUploadView.as_view(), name="instructor-question-upload"),
    # Endpoint za dohvat pitanja za kviz studenta prema predmetu i znanju
    path("student/quiz/<str:subject_name>/", views.StudentQuizView.as_view(), name="student-quiz"),

    path("cron/reminders/", views.ReminderCronView.as_view()),
    # Endpoint za dohvacanje instruktorovih pitanja
    path("instructor/questions/my/", views.InstructorQuestionsListView.as_view(), name="my-instructor-questions"),
    # Endpoint za brisanje pitanja
    path("question/delete/<int:id>/", views.QuestionDeleteView.as_view(), name="instructor-question-delete"),
    path("google/calendar/connect/", views.GoogleCalendarConnectView.as_view(),name="google-calendar-connect"),
    # Endpoint za kreiranje summaryja lekcije od strane instruktora
    path("lesson/<int:lesson_id>/summary/", views.LessonSummaryView.as_view(), name="lesson-summary"),

    path("student/summaries/", views.StudentSummariesView.as_view()),

    path("student/knowledge/", views.UpdateKnowledgeLevelView.as_view()),

    path("review/delete/<int:id>/", views.ReviewDeleteView.as_view(), name="review-delete"),

    path("admin/questions/", views.AdminQuestionsListView.as_view()),

    path("admin/reviews/", views.AdminReviewsListView.as_view()),
    # ADMIN
    path("admin/lessons/", views.AdminLessonsListView.as_view()),
    path("admin/lesson/<int:lesson_id>/delete/", views.LessonDeleteView.as_view()),
    path("admin/analytics/", views.AdminAnalyticsView.as_view()),
    path("admin/review/<int:id>/delete/", views.ReviewDeleteView.as_view()),
    
    path("payments/<int:lesson_id>/complete/", views.CompletePaymentView.as_view(), name="payment-complete"),
    path("reviews/<int:lesson_id>/allowed/", views.ReviewAccessView.as_view(), name="review-allowed"),
    path("payments/<int:lesson_id>/allowed/", views.PaymentAccessView.as_view(), name="payment-allowed"),
    path("lesson/<int:lesson_id>/summary/allowed/", views.SummaryAccessView.as_view(), name="summary-allowed"),
    path("flow/next/", views.FlowNextActionView.as_view(), name="flow-next"),

]