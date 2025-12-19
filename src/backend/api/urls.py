from django.urls import path
from . import views

urlpatterns = [
    # Endpoint za prikaz svih lekcija i kreiranje nove lekcije (GET i POST)
    path('lessons/', views.LessonListCreateView.as_view(), name='lesson-list'),
    # Endpoint za dohvat, ažuriranje ili brisanje pojedine lekcije prema ID-u (GET, PUT/PATCH, DELETE)
    path('lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson-detail'),
    # Endpoint preko kojeg će instruktor uređivati svoj profil
    path('instructor/me/', views.InstructorUpdateView.as_view(), name='instructor-update'),
    path("instructor/inf/", views.MyInstructorProfileView.as_view(), name="instructor-inf"),
    path("instructor/<int:pk>/", views.InstructorPublicProfileView.as_view(), name="instructor-detail"),
]