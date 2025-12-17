from django.urls import path
from api.views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Endpoint za prikaz svih lekcija i kreiranje nove lekcije (GET i POST)
    path('lessons/', LessonListCreateView.as_view(), name='lesson-list'),
    # Endpoint za dohvat, ažuriranje ili brisanje pojedine lekcije prema ID-u (GET, PUT/PATCH, DELETE)
    path('lessons/<int:pk>/', LessonDetailView.as_view(), name='lesson-detail'),
    path("user/register/", CreateUserView.as_view(), name="register"),
    path("user/role/", UserRoleView.as_view(), name="user_role"),
    path("token/", TokenObtainPairView.as_view(), name="get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("auth/google/code/", GoogleAuthCodeExchangeView.as_view(), name="google_auth_code_exchange"),
    path("user/profile/", user_profile, name="user_profile"),
    path("select-role/", UserRoleView.as_view(), name="select-role"),
]
