from django.urls import path
from .views import *

urlpatterns = [
    path('instructor/me/', InstructorUpdateView.as_view(), name='instructor-update'),
    path("instructor/inf/", MyInstructorProfileView.as_view(), name="instructor-inf"),
    path("instructor/<int:pk>/", InstructorPublicProfileView.as_view(), name="instructor-detail"),
]