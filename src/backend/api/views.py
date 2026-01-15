from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model, logout
from rest_framework import generics, views, status, permissions
from rest_framework.views import APIView
from .serializers import *
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
import requests
import jwt
import time
from rest_framework_simplejwt.tokens import RefreshToken
import uuid
from django.contrib.auth.hashers import make_password
from .models import Lesson, Instructor, Student, Attendance, Review, Payment, Question, Summary
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Count, F
from datetime import timedelta
from api.utils1 import create_google_calendar_event
from api.utils1 import sync_existing_lessons_to_google
from api.utils1 import send_24h_lesson_reminders


User = get_user_model()

def expire_lessons():
    now = timezone.localtime()
    today = now.date()

    threshold_date_time = now - timedelta(minutes=15)
    threshold_time = threshold_date_time.time()
    threshold_date = threshold_date_time.date()

    expired_lessons = Lesson.objects.filter(
        status="ACTIVE",  
        date__lt=threshold_date,  
    ) | Lesson.objects.filter(
        status="ACTIVE",  
        date=today,  
        time__lt=threshold_time
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

from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.tokens import RefreshToken
import requests, jwt, uuid
from api.models import Instructor


class GoogleAuthCodeExchangeView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get("code")

        if not code:
            return Response(
                {"error": "Authorization code missing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_exchange_url = "https://oauth2.googleapis.com/token"

        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": "postmessage",
            "grant_type": "authorization_code",
        }

        try:
            response = requests.post(token_exchange_url, data=data)
            response.raise_for_status()
            tokens = response.json()

            id_token = tokens.get("id_token")
            if not id_token:
                return Response(
                    {"error": "Failed to retrieve ID token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Decode ID token
            user_info = jwt.decode(id_token, options={"verify_signature": False})

            email = user_info.get("email")
            first_name = user_info.get("given_name", "")
            last_name = user_info.get("family_name", "")

            if not email:
                return Response(
                    {"error": "Google account has no email."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": f"google_{uuid.uuid4().hex[:10]}",
                    "first_name": first_name,
                    "last_name": last_name,
                    "password": make_password(uuid.uuid4().hex),
                },
            )

            # 🔴 KLJUČNI DIO — SPREMANJE CALENDAR ID-a
            try:
                instructor = Instructor.objects.get(instructor_id=user)
                instructor.google_calendar_email = email  # primary calendar
                instructor.save(update_fields=["google_calendar_email"])
            except Instructor.DoesNotExist:
                # ako user još nema instructor profil – ignoriramo
                pass

            # JWT tokeni
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "created": created,
                },
                status=status.HTTP_200_OK,
            )

        except requests.exceptions.RequestException as e:
            print("Google token exchange failed:", e)
            return Response(
                {"error": "External authentication failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            print("Internal error:", e)
            return Response(
                {"error": "Internal server error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

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
    def perform_create(self, serializer):
        instructor = getattr(self.request.user, "instructor", None)
        if not instructor:
            raise serializers.ValidationError(
                "Instructor profil nije pronađen."
            )

        lesson = serializer.save(instructor_id=instructor)

        if instructor.google_refresh_token:
            create_google_calendar_event(instructor, lesson)
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


class LessonDeleteView(generics.DestroyAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'lesson_id'

    def get_queryset(self):
        user = self.request.user
        # Osiguravamo da instruktor može obrisati samo svoje lekcije
        if user.role == 'INSTRUCTOR':
            return Lesson.objects.filter(instructor_id__instructor_id=user)
        if user.is_superuser:
            return Lesson.objects.all()
        return Lesson.objects.none()

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
                    None

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

class LessonJitsiRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        user = request.user

        try:
            lesson = Lesson.objects.get(lesson_id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not found"}, status=404)

        # 👨‍🏫 INSTRUKTOR
        if user.role == User.Role.INSTRUCTOR:
            if lesson.instructor_id.instructor_id != user:
                return Response({"error": "Forbidden"}, status=403)

            if not lesson.jitsi_room:
                lesson.jitsi_room = f"infima-{lesson.lesson_id}-{uuid.uuid4().hex[:8]}"
                lesson.save(update_fields=["jitsi_room"])

            return Response({"room": lesson.jitsi_room})

        # 👨‍🎓 STUDENT
        if user.role == User.Role.STUDENT:
            student = getattr(user, "student", None)

            if not Attendance.objects.filter(
                lesson=lesson,
                student=student
            ).exists():
                return Response({"error": "Forbidden"}, status=403)

            if not lesson.jitsi_room:
                return Response(
                    {"error": "Meeting not started yet"},
                    status=400
                )

            return Response({"room": lesson.jitsi_room})

        return Response({"error": "Forbidden"}, status=403)
    


class LessonJaasTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        user = request.user

        try:
            lesson = Lesson.objects.get(lesson_id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not found"}, status=404)

        # room mora postojati (instruktor “starta” meeting)
        if not lesson.jitsi_room:
            return Response({"error": "Meeting not started yet"}, status=400)

        # instr. smije ako je njegov
        if user.role == User.Role.INSTRUCTOR:
            if lesson.instructor_id.instructor_id != user:
                return Response({"error": "Forbidden"}, status=403)

        # student smije ako ima Attendance
        elif user.role == User.Role.STUDENT:
            student = getattr(user, "student", None)
            if not Attendance.objects.filter(lesson=lesson, student=student).exists():
                return Response({"error": "Forbidden"}, status=403)
        else:
            return Response({"error": "Forbidden"}, status=403)

        room_name = lesson.jitsi_room
        now = int(time.time())

        payload = {
            "aud": "jitsi",
            "iss": "chat",
            "sub": settings.JAAS_APP_ID,
            "room": room_name,
            "exp": now + 60 * 60,
            "nbf": now - 10,
            "context": {
                "user": {
                    "id": str(user.id),
                    "name": f"{user.first_name} {user.last_name}".strip() or user.email,
                    "email": user.email,
                    # moderator true samo za instruktora (ako želiš)
                    "moderator": "true" if user.role == User.Role.INSTRUCTOR else "false",
                }
            },
        }

        token = jwt.encode(
            payload,
            settings.JAAS_PRIVATE_KEY,
            algorithm="RS256",
            headers={"kid": settings.JAAS_KID, "typ": "JWT"},
        )

        return Response({
            "appId": settings.JAAS_APP_ID,
            "roomName": room_name,
            "jwt": token,
        })

class EndLessonView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        user = request.user

        try:
            lesson = Lesson.objects.get(lesson_id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not found"}, status=404)

        # instruktor završava meeting
        if user.role == User.Role.INSTRUCTOR:
            if lesson.instructor_id.instructor_id != user:
                return Response({"error": "Forbidden"}, status=403)

            return Response({
                "redirect_to": f"/summary/{lesson.lesson_id}"
            })

        # student ide na payment
        if user.role == User.Role.STUDENT:
            return Response({
                "redirect_to": f"/payment/{lesson.lesson_id}"
            })

        return Response({"error": "Invalid role"}, status=400)

class SubmitReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        user = request.user

        if user.role != User.Role.STUDENT:
            return Response({"error": "Only students can review"}, status=403)

        try:
            lesson = Lesson.objects.get(lesson_id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not found"}, status=404)

        student = user.student
        instructor = lesson.instructor_id

        Review.objects.create(
            instructor=instructor,
            student=student,
            rating=request.data.get("rating"),
            description=request.data.get("description", "")
        )
        
        lesson.status = Lesson.Status.EXPIRED
        lesson.is_available = False
        lesson.save(update_fields=["status", "is_available"])

        return Response({
            "redirect_to": "/home/student"
        })

import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


class ConfirmPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        user = request.user

        if user.role != User.Role.STUDENT:
            return Response({"error": "Only students can pay"}, status=403)

        try:
            lesson = Lesson.objects.get(lesson_id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not found"}, status=404)

        amount = lesson.price * 100 if lesson.price else 1000  # centi

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            customer_email=user.email,
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Instrukcije – {lesson.subject.name if lesson.subject else 'Lekcija'}"
                    },
                    "unit_amount": amount,
                },
                "quantity": 1,
            }],
            success_url=f"{settings.FRONTEND_URL}/review/{lesson.lesson_id}",
            cancel_url=f"{settings.FRONTEND_URL}/payment/{lesson.lesson_id}",
            metadata={
                "lesson_id": lesson.lesson_id,
                "student_id": user.id,
            }
        )

        return Response({
            "checkout_url": session.url
        })

class MyInstructorReviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # provjera da je user instruktor
        try:
            instructor = Instructor.objects.get(instructor_id=user)
        except Instructor.DoesNotExist:
            return Response(
                {"error": "Instruktor profil nije pronađen."},
                status=404
            )

        reviews = (
            Review.objects
            .filter(instructor=instructor)
            .select_related("student", "student__student_id")
            .order_by("-id")
        )

        serializer = InstructorReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
class InstructorReviewsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):

        try:
            Instructor.objects.get(instructor_id=pk)
        except Instructor.DoesNotExist:
            return Response({"error": "Instruktor nije pronađen."}, status=404)

        reviews = (
            Review.objects
            .filter(instructor_id=pk)
            .select_related("student", "student__student_id")
            .order_by("-id")
        )

        serializer = InstructorReviewSerializer(reviews, many=True, context={"request": request})
        return Response(serializer.data)

class InstructorQuestionUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "INSTRUCTOR":
            return Response(
                {"error": "Only instructors can upload questions"},
                status=status.HTTP_403_FORBIDDEN
            )

        instructor = Instructor.objects.get(instructor_id=request.user)

        serializer = QuestionBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        created = []
        for q in serializer.validated_data["questions"]:
            question = Question.objects.create(
                author=instructor,
                **q
            )
            created.append(question.id)

        return Response(
            {
                "message": "Questions uploaded successfully",
                "count": len(created),
                "question_ids": created
            },
            status=status.HTTP_201_CREATED
        )

# preslikavanje knowledge_level -> difficulty
KNOWLEDGE_TO_DIFFICULTY = {
    "loša": "jako lagano",
    "dovoljna": "lagano",
    "dobra": "srednje",
    "vrlo_dobra": "teško",
    "odlična": "jako teško",
}

class StudentQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, subject_name: str):
        if request.user.role != "STUDENT":
            return Response({"error": "Only students can access this endpoint"}, status=403)

        try:
            student = Student.objects.get(student_id=request.user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=404)

        grade = student.grade
        school_level = student.school_level

        # filtriramo knowledge_level za taj predmet
        questions_to_return = []
        for kl in student.knowledge_level:
            if kl.get("subject").lower() != subject_name.lower():
                continue  # preskoči ako nije traženi predmet

            level = kl.get("level")
            difficulty = KNOWLEDGE_TO_DIFFICULTY.get(level.lower())
            if not difficulty:
                continue

            subject_questions = Question.objects.filter(
                subject__name__iexact=subject_name,
                grade=grade,
                school_level=school_level,
                difficulty=difficulty
            )
            questions_to_return.extend(subject_questions)

        serializer = StudentQuestionSerializer(questions_to_return, many=True)
        return Response(serializer.data)

class ReminderCronView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        token = request.headers.get("X-CRON-TOKEN")
        print(">>> CRON ENDPOINT HIT")
        print(">>> HEADERS:", dict(request.headers))
        if token != settings.CRON_SECRET:
            return Response({"error": "unauthorized"}, status=401)

        send_24h_lesson_reminders()
        return Response({"status": "ok"})
    
class InstructorQuestionsListView(APIView):
    queryset = Question.objects.all()
    serializer_class = StudentQuestionSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = self.request.user
        if user.role == 'INSTRUCTOR':
            questions = Question.objects.filter(author__instructor_id=user)
        else:
            questions = Question.objects.none()

        serializer = StudentQuestionSerializer(questions, many=True)
        return Response(serializer.data)
    
class QuestionDeleteView(generics.DestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = StudentQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        if user.role == 'INSTRUCTOR':
            return Question.objects.filter(author__instructor_id=user)
        if user.is_superuser:
            return Question.objects.all()
        return Question.objects.none()
class GoogleCalendarConnectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != User.Role.INSTRUCTOR:
            return Response(
                {"error": "Only instructors can connect calendar"},
                status=403
            )

        code = request.data.get("code")
        if not code:
            return Response({"error": "Code missing"}, status=400)

        response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": "postmessage",
                "grant_type": "authorization_code",
            },
        )

        tokens = response.json()

        refresh_token = tokens.get("refresh_token")
        if not refresh_token:
            return Response(
                {"error": "No refresh token received"},
                status=400
            )

        instructor = request.user.instructor
        instructor.google_refresh_token = refresh_token
        instructor.google_calendar_email = request.user.email
        instructor.save(update_fields=["google_refresh_token", "google_calendar_email"])
        sync_existing_lessons_to_google(instructor)

        return Response({"status": "calendar_connected"})
        return Question.objects.none()
    
class LessonSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        if request.user.role != "INSTRUCTOR":
            return Response(
                {"error": "Only instructors can upload summaries"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            instructor = Instructor.objects.get(instructor_id=request.user)
        except Instructor.DoesNotExist:
            return Response(
                {"error": "Instructor profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            lesson = Lesson.objects.get(pk=lesson_id)
        except Lesson.DoesNotExist:
            return Response(
                {"error": "Lesson not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SummarySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                author=instructor,
                lesson=lesson   
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class StudentSummariesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "STUDENT":
            return Response(
                {"error": "Only students can access summaries"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            student = Student.objects.get(student_id=request.user)
        except Student.DoesNotExist:
            return Response(
                {"error": "Student profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        summaries = Summary.objects.filter(
            lesson__attendance__student=student
        ).select_related("lesson", "lesson__subject")

        serializer = SummarySerializer(summaries, many=True)
        return Response(serializer.data)
