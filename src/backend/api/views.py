from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model, logout
from rest_framework import generics, views, status, permissions
from rest_framework.views import APIView
from .serializers import UserSerializer, LessonSerializer, InstructorUpdateSerializer, MyInstructorProfileSerializer, StudentProfileSerializer, InstructorListSerializer, StudentUpdateSerializer, AttendanceCreateSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
import requests
import jwt
from rest_framework_simplejwt.tokens import RefreshToken
import uuid
from django.contrib.auth.hashers import make_password
from .models import Lesson, Instructor, Student, Attendance
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Count, F


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
            return Lesson.objects.filter(is_available=True, status="ACTIVE").exclude(status="EXPIRED").annotate(occupied=Count("attendance")).filter(occupied__lt=F("max_students"))   

        # Ostali (bez role) -> ništa
        return Lesson.objects.none()

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

class InstructorUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        CREATE ili UPDATE instruktora koji pripada trenutno prijavljenom korisniku.
        Frontend NE šalje ID.
        """

        if request.user.role != 'INSTRUCTOR':
            return Response(
                {"detail": "Only instructors can edit instructor profile."},
                status=status.HTTP_403_FORBIDDEN
            )

        instructor, created = Instructor.objects.get_or_create(
            instructor_id=request.user,
            defaults={
                "bio": "",
                "location": "",
                "price": 0,
                "video_url": ""
            }
        )

        # zapamti staru lokaciju da znamo je li se promijenila
        old_location = instructor.location

        serializer = InstructorUpdateSerializer(
            instructor,
            data=request.data,
            partial=True  # dopušta slanje samo dijela polja
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # nova lokacija iz requesta (ako je uopće poslano polje "location")
        new_location = serializer.validated_data.get("location", old_location)

        # ako imamo novu (drugačiju) lokaciju, probamo ju geokodirati
        if new_location and new_location != old_location:
            api_key = getattr(settings, "GOOGLE_MAPS_API_KEY", None)
            if api_key:
                try:
                    resp = requests.get(
                        "https://maps.googleapis.com/maps/api/geocode/json",
                        params={"address": new_location, "key": api_key},
                        timeout=5,
                    )
                    data = resp.json()
                    if data.get("status") == "OK":
                        loc = data["results"][0]["geometry"]["location"]
                        instructor.lat = loc.get("lat")
                        instructor.lng = loc.get("lng")
                        instructor.save(update_fields=["lat", "lng"])
                except Exception as e:
                    # ne rušimo zahtjev ako geokodiranje faila – samo ispišemo u konzolu
                    print("Geocoding failed:", e)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class MyInstructorProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            instructor = Instructor.objects.get(instructor_id=request.user)
        except Instructor.DoesNotExist:
            return Response({"error": "Instruktor profil nije pronađen."}, status=404)

        serializer = MyInstructorProfileSerializer(instructor)
        return Response(serializer.data)
    
class InstructorPublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            instructor = Instructor.objects.get(instructor_id=pk)
        except Instructor.DoesNotExist:
            return Response(
                {"error": "Instruktor nije pronađen."},
                status=404
            )

        serializer = MyInstructorProfileSerializer(
            instructor,
            context={"request": request}
        )
        return Response(serializer.data)
    
class StudentUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        CREATE ili UPDATE studenta koji pripada trenutno prijavljenom korisniku.
        """

        if request.user.role != 'STUDENT':
            return Response(
                {"detail": "Only students can edit student profile."},
                status=status.HTTP_403_FORBIDDEN
            )

        student, created = Student.objects.get_or_create(
            student_id=request.user,
            defaults={
                "grade": None,
                "school_level": None,
                "knowledge_level": [],  
                "learning_goals": "", 
                "preferred_times": [],  
                "notifications_enabled": False
            }
        )

        serializer = StudentUpdateSerializer(
            student,
            data=request.data,
            partial=True  # dopušta slanje samo dijela polja
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class MyStudentProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = Student.objects.get(student_id=request.user)
        except Student.DoesNotExist:
            return Response(
                {"error": "Student profil nije pronađen."},
                status=404
            )

        serializer = StudentProfileSerializer(student)
        return Response(serializer.data)
    

class StudentPublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            student = Student.objects.get(student_id=pk)
        except Student.DoesNotExist:
            return Response(
                {"error": "Student nije pronađen."},
                status=404
            )

        serializer = StudentProfileSerializer(
            student,
            context={"request": request}
        )
        return Response(serializer.data)
    

class InstructorListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        instructors = Instructor.objects.select_related("instructor_id")
        serializer = InstructorListSerializer(instructors, many=True)
        return Response(serializer.data)
    

class StudentMyLessonsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.STUDENT:
            return Response({"error": "Only students can access this endpoint."}, status=403)

        student = getattr(request.user, "student", None)
        if not student:
            return Response({"error": "Student profil nije pronađen."}, status=404)

        lessons = (
            Lesson.objects
            .filter(attendance__student=student).filter(is_available=True, status="ACTIVE").exclude(status="EXPIRED")
            .select_related(
                "subject",
                "instructor_id",
                "instructor_id__instructor_id"
            )
            .order_by("-date", "-time")
            .distinct()
        )

        serializer = LessonSerializer(lessons, many=True)
        return Response(serializer.data)
    
class ReserveLessonView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != User.Role.STUDENT:
            return Response(
                {"error": "Only students can reserve lessons"},
                status=403
            )

        serializer = AttendanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lesson_id = serializer.validated_data["lesson_id"]

        # student
        try:
            student = Student.objects.get(student_id=request.user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=404)

        # lesson
        try:
            lesson = Lesson.objects.get(
                lesson_id=lesson_id,
                status="ACTIVE",
                is_available=True
            )
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not available"}, status=404)

        # već prijavljen?
        if Attendance.objects.filter(lesson=lesson, student=student).exists():
            return Response(
                {"error": "Already reserved"},
                status=409
            )

        # kapacitet
        current_count = Attendance.objects.filter(lesson=lesson).count()
        if current_count >= lesson.max_students:
            return Response(
                {"error": "Lesson is full"},
                status=400
            )

        # upis
        attendance = Attendance.objects.create(
            lesson=lesson,
            student=student
        )

        return Response(
            {
                "message": "Lesson reserved successfully",
                "lesson_id": lesson.lesson_id
            },
            status=201
        )
    
class CancelLessonView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != User.Role.STUDENT:
            return Response(
                {"error": "Only students can cancel lessons"},
                status=403
            )
        
        serializer = AttendanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lesson_id = serializer.validated_data["lesson_id"]

        try:
            student = Student.objects.get(student_id=request.user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        attendance = Attendance.objects.filter(lesson_id=lesson_id, student=student)

        if not attendance.exists():
            return Response(
                {"error": "Reservation not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        attendance.delete()

        return Response(
            {"message": "Lesson reservation cancelled successfully",
             "lesson_id": lesson_id},
            status=status.HTTP_200_OK
        )
