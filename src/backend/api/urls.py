from django.urls import path
from . import views

urlpatterns = [
    path('lessons/', views.LessonListCreateView.as_view(), name='lesson-list'),
    path('lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson-detail'),
    path("instructors/inf/", views.MyInstructorProfileView.as_view(), name="instructor-inf"),
     path("instructors/<int:pk>/", views.InstructorPublicProfileView.as_view(), name="instructor-detail"),
]