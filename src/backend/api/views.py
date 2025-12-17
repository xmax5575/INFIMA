from django.contrib.auth import get_user_model
from rest_framework import generics, views, status, permissions
from rest_framework.views import APIView
from .serializers import UserSerializer, LessonSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
import requests
import jwt
from rest_framework_simplejwt.tokens import RefreshToken
import uuid
from django.contrib.auth.hashers import make_password
from .models import Lesson
from rest_framework import serializers
from django.utils import timezone



User = get_user_model()

def expire_lessons():
    now = timezone.localtime()
    today = now.date()
    now_time = now.time()

    expired_lessons = Lesson.objects.filter(
        status="ACTIVE",  
        date__lt=today,  
    ) | Lesson.objects.filter(
        status="ACTIVE",  
        date=today,  
        time__lt=now_time  
    )
    
    expired_lessons.update(status="EXPIRED", is_available=False)
# Funkcija za dohvat lekcija na temelju uloge korisnika
def get_lessons_for_user(user):
    if user.is_superuser or user.role == User.Role.ADMIN:
        return Lesson.objects.all()

    if user.role == User.Role.INSTRUCTOR:
        return Lesson.objects.filter(instructor_id__instructor_id=user)

    if user.role == User.Role.STUDENT:
        return Lesson.objects.filter(is_available=True)

    return Lesson.objects.none()


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class GoogleAuthCodeExchangeView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        code = request.data.get('code')

        if not code:
            return Response({"error": "Authorization code missing."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Exchange code for tokens (id_token)
        token_exchange_url = "https://oauth2.googleapis.com/token"
        
        # NOTE: You MUST set these in your Django settings.py file
        CLIENT_ID = settings.GOOGLE_CLIENT_ID
        CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET
        
        data = {
            'code': code,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'redirect_uri': 'postmessage', # Standard value for this flow
            'grant_type': 'authorization_code',
        }

        try:
            # Send POST request to Google's token endpoint
            response = requests.post(token_exchange_url, data=data)
            response.raise_for_status() # Raise exception for HTTP errors (4xx or 5xx)
            tokens = response.json()
            id_token = tokens.get('id_token')

            if not id_token:
                return Response({"error": "Failed to retrieve ID token from Google."}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Decode ID Token to get user info
            # The 'jwt' library is required to decode the token.
            # IMPORTANT: For production, you should use google-auth-library to properly verify the signature.
            user_info = jwt.decode(id_token, options={"verify_signature": False})
            
            email = user_info.get('email')
            first_name = user_info.get('given_name', '')
            last_name = user_info.get('family_name', '')
            unique_username = f"google_{email.split('@')[0]}_{str(uuid.uuid4())[:8]}"

            # 3. Authenticate or Register User
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': unique_username,
                    'first_name': first_name,
                    'last_name': last_name,
                    'password': make_password(str(uuid.uuid4()))
                }
            )

            # 4. Generate your custom JWTs (using DRF Simple JWT logic)
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "access": str(refresh.access_token), 
                "refresh": str(refresh),
                "created": created # Optional: tell frontend if user was created
            }, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            # Handle network errors, connection problems, or Google's API errors
            print(f"Google token exchange failed: {e}")
            return Response({"error": "External authentication failed."}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.exceptions.DecodeError as e:
            print(f"JWT decode error: {e}")
            return Response({"error": "Invalid token received."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Catch all other exceptions (e.g., database issues)
            print(f"Internal error during authentication: {e}")
            return Response({"error": "Internal server error."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserRoleView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Return the user's current role or null
        return Response({
            'role': request.user.role,
            'has_role': request.user.has_role
        })
    
    def post(self, request):
        role_raw = request.data.get('role')
        if not role_raw:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        # Accept case-insensitive role values (frontend may send 'student' / 'instructor')
        try:
            role_value = str(role_raw).strip().upper()
        except Exception:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        if role_value not in [User.Role.STUDENT, User.Role.INSTRUCTOR]:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.role:
            return Response({'error': 'Role already set'}, status=status.HTTP_400_BAD_REQUEST)

        user.role = role_value
        user.save()
        return Response({'role': user.role})
    
class LessonListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Prikazuje lekcije ovisno o ulozi korisnika."""
        user = self.request.user

        expire_lessons()

        # ADMIN -> vidi sve lekcije
        if user.is_superuser or user.role == 'ADMIN':
            return Lesson.objects.all()

        # INSTRUKTOR -> vidi samo svoje lekcije
        if user.role == 'INSTRUCTOR':
            return Lesson.objects.filter(instructor_id__instructor_id=user).exclude(status="EXPIRED")

        # STUDENT -> vidi samo slobodne lekcije
        if user.role == 'STUDENT':
            return Lesson.objects.filter(is_available=True, status="ACTIVE").exclude(status="EXPIRED")  

        # Ostali (bez role) -> ništa
        return Lesson.objects.none()
        return get_lessons_for_user(self.request.user)

    def perform_create(self, serializer):
        """Kada instruktor kreira lekciju, automatski ga postavi kao instruktora."""
        instructor = getattr(self.request.user, "instructor", None)
        if not instructor:
            raise serializers.ValidationError("Instructor profil nije pronađen za ovog korisnika.")
        serializer.save(instructor_id=instructor)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Dodatna zaštita — svatko vidi ono što smije."""
        user = self.request.user

        expire_lessons()

        if user.is_superuser or user.role == 'ADMIN':
            return Lesson.objects.all()
        if user.role == 'INSTRUCTOR':
            return Lesson.objects.filter(instructor_id__instructor_id=user).exclude(status="EXPIRED")
        if user.role == 'STUDENT':
            return Lesson.objects.filter(is_available=True, status="ACTIVE").exclude(status="EXPIRED")  

        return Lesson.objects.none()
