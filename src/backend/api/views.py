from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model, logout
from rest_framework import generics, views, status, permissions
from rest_framework.views import APIView
from .serializers import UserSerializer, LessonSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
import requests
import jwt
from rest_framework_simplejwt.tokens import RefreshToken
import uuid
from django.contrib.auth.hashers import make_password
from .models import Lesson

User = get_user_model()

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
        

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserRoleView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Return the user's current role or null
        return Response({
            'role': request.user.role,
            'has_role': request.user.has_role
        })
    
    def post(self, request):
        role = request.data.get('role')
        if role not in [User.Role.STUDENT, User.Role.INSTRUCTOR]:
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        if user.role:
            return Response(
                {'error': 'Role already set'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.role = role
        user.save()
        return Response({'role': role})
     
class CreateRoleView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Render the role selection page for HTML forms.
        """
        # For HTML rendering, you can pass context if needed
        return render(request, 'users/select_role.html')

    def post(self, request):
        """
        Set the user's role via POST.
        Accepts either form data (HTML) or JSON (API).
        """
        role = request.data.get('role') or request.POST.get('role')

        # Map valid input to model Role choices
        valid_roles = {
            'student': User.Role.STUDENT,
            'instructor': User.Role.INSTRUCTOR
        }

        if role not in valid_roles:
            # For API request, return JSON error
            if request.content_type == 'application/json':
                return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
            # For HTML, re-render with error message
            return render(request, 'users/select_role.html', {'error': 'Invalid role'})

        user = request.user

        if user.role:
            if request.content_type == 'application/json':
                return Response({'error': 'Role already set'}, status=status.HTTP_400_BAD_REQUEST)
            return redirect('home')  # already set, redirect to home

        # Save the role
        user.role = valid_roles[role]
        user.save()

        from .models import Student, Instructor

        if user.role == User.Role.STUDENT:
            Student.objects.get_or_create(student_id=user, defaults={'grade': 1})
        elif user.role == User.Role.INSTRUCTOR:
            Instructor.objects.get_or_create(instructor_id=user, defaults={'price': 0, 'bio': '', 'location': ''})

        # Redirect depending on request type
        if request.content_type == 'application/json':
            return Response({'role': user.role}, status=status.HTTP_200_OK)
        else:
            return redirect('home')  # redirect to homepage/dashboard

class CheckUserRoleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # prvo provjeri korisnika
        if request.user.is_authenticated:
            allowed_paths = (
                '/api/select-role/',
                '/select-role/',
                '/api/token/',
                '/api/token/refresh/',
                '/api/auth/',
                '/admin/',
                '/static/',
            )
            #ako ne počinje kao neki od allowe_paths onda redirectaj na select-role
            if not any(request.path.startswith(p) for p in allowed_paths):
                if not request.user.has_role:
                    return redirect('/api/select-role/')

        # ako ima rolu ili je na dozvoljenoj ruti, nastavi normalno
        response = self.get_response(request)
        return response

class LessonListCreateView(generics.ListCreateAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # automatski dodaje instruktora na temelju logiranog usera
        instructor = getattr(self.request.user, 'instructor', None)
        #if not instructor:
         #   raise serializers.ValidationError("Instructor nije pronađen za ovog korisnika.")
        serializer.save(instructor_id=instructor)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]