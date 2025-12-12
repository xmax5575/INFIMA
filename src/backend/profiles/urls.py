from django.urls import path
from .views import InstructorProfileView

urlpatterns = [
    path("instructor/", InstructorProfileView.as_view(), name="instructor-profile"),
]