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
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import IntegrityError

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

        # 👨‍🏫 instruktor -> označi call_ended za sve attendances + summary
        if user.role == User.Role.INSTRUCTOR:
            if lesson.instructor_id.instructor_id != user:
                return Response({"error": "Forbidden"}, status=403)

            Attendance.objects.filter(lesson=lesson).update(call_ended=True)  # ✅
            return Response({"redirect_to": f"/summary/{lesson.lesson_id}"})

        # 👨‍🎓 student -> označi call_ended za svog attendance + payment
        if user.role == User.Role.STUDENT:
            student = getattr(user, "student", None)
            if not student:
                return Response({"error": "Student profile not found"}, status=404)

            attendance = Attendance.objects.filter(lesson=lesson, student=student).first()
            if not attendance:
                return Response({"error": "Forbidden"}, status=403)

            attendance.call_ended = True
            attendance.save(update_fields=["call_ended"])

            amount = lesson.price or lesson.instructor_id.price or 10
            Payment.objects.get_or_create(
                attendance=attendance,
                defaults={"amount": amount, "is_paid": False},
            )

            return Response({"redirect_to": f"/payment/{lesson.lesson_id}"})

        return Response({"error": "Invalid role"}, status=400)

class SubmitReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        user = request.user
        if user.role != User.Role.STUDENT:
            return Response({"error": "Only students can review"}, status=403)

        lesson = Lesson.objects.get(lesson_id=lesson_id)
        student = user.student

        attendance = Attendance.objects.filter(lesson=lesson, student=student).first()
        if not attendance:
            return Response({"error": "Forbidden"}, status=403)

        if not attendance.call_ended:
            return Response({"error": "Call not ended"}, status=403)

        payment = getattr(attendance, "payment", None)
        if not payment or not payment.is_paid:
            return Response({"error": "Not paid"}, status=403)

        if attendance.review_done:
            return Response({"redirect_to": "/home/student"}, status=200)

        Review.objects.create(
            instructor=lesson.instructor_id,
            student=student,
            rating=request.data.get("rating"),
            description=request.data.get("description", "")
        )

        attendance.review_done = True
        attendance.save(update_fields=["review_done"])

        return Response({"redirect_to": "/home/student"}, status=200)

class ReviewAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        # samo student
        if request.user.role != "STUDENT":
            return Response({"allowed": False}, status=status.HTTP_403_FORBIDDEN)

        # lesson mora postojati
        try:
            lesson = Lesson.objects.get(lesson_id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"allowed": False}, status=status.HTTP_404_NOT_FOUND)

        # student mora imati Attendance za tu lekciju
        student = getattr(request.user, "student", None)
        if not student:
            return Response({"allowed": False}, status=status.HTTP_404_NOT_FOUND)

        attendance = Attendance.objects.filter(lesson=lesson, student=student).first()
        if not attendance:
            return Response({"allowed": False}, status=status.HTTP_403_FORBIDDEN)

        # poziv mora biti završen
        if not getattr(attendance, "call_ended", False):
            return Response({"allowed": False, "redirect_to": f"/lesson/{lesson_id}/call"}, status=200)

        # mora biti plaćeno
        payment = Payment.objects.filter(attendance=attendance).first()
        if not payment or not payment.is_paid:
            return Response({"allowed": False, "redirect_to": f"/payment/{lesson_id}"}, status=200)

        # review se ne smije duplo
        if getattr(attendance, "review_done", False):
            return Response({"allowed": False, "redirect_to": "/home/student"}, status=200)

        return Response({"allowed": True}, status=200)
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

        student = getattr(user, "student", None)
        if not student:
            return Response({"error": "Student profile not found"}, status=404)

        attendance = Attendance.objects.filter(lesson=lesson, student=student).first()
        if not attendance:
            return Response({"error": "Forbidden"}, status=403)

        if not attendance.call_ended:
            return Response({"error": "Call not ended yet"}, status=403)

        payment, _ = Payment.objects.get_or_create(
            attendance=attendance,
            defaults={"amount": lesson.price or lesson.instructor_id.price or 10, "is_paid": False},
        )

        if payment.is_paid:
            return Response({"checkout_url": None, "already_paid": True})

        amount_cents = int(payment.amount or 10) * 100

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
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }],
            # ✅ VRATI NA PAYMENT STRANICU S SESSION ID-om
            success_url=f"{settings.FRONTEND_URL}/payment/{lesson.lesson_id}?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/payment/{lesson.lesson_id}",
            metadata={
                "lesson_id": lesson.lesson_id,
                "student_user_id": user.id,
            }
        )

        return Response({"checkout_url": session.url})
#sta je na redu???
class FlowNextActionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # -------- STUDENT --------
        if user.role == User.Role.STUDENT:
            student = getattr(user, "student", None)
            if not student:
                return Response({"next_action": None})

            # 1) neplaćeno -> PAYMENT
            pending_payment = (
                Payment.objects
                .filter(
                    attendance__student=student,
                    attendance__call_ended=True,
                    is_paid=False,
                )
                .select_related("attendance__lesson")
                .order_by("attendance__lesson__date", "attendance__lesson__time")
                .first()
            )
            if pending_payment:
                lid = pending_payment.attendance.lesson.lesson_id
                return Response({
                    "next_action": "payment",
                    "lesson_id": lid,
                    "redirect_to": f"/payment/{lid}",
                })

            # 2) plaćeno, ali review nije -> REVIEW
            pending_review = (
                Attendance.objects
                .filter(
                    student=student,
                    call_ended=True,
                    review_done=False,
                    payment__is_paid=True,
                )
                .select_related("lesson")
                .order_by("lesson__date", "lesson__time")
                .first()
            )
            if pending_review:
                lid = pending_review.lesson.lesson_id
                return Response({
                    "next_action": "review",
                    "lesson_id": lid,
                    "redirect_to": f"/review/{lid}",
                })

            return Response({"next_action": None})

        # -------- INSTRUCTOR --------
        if user.role == User.Role.INSTRUCTOR:
            instructor = getattr(user, "instructor", None)
            if not instructor:
                return Response({"next_action": None})

            pending_summary = (
                Lesson.objects
                .filter(
                    instructor_id=instructor,
                    attendance__call_ended=True,
                    summary__isnull=True,   # Summary je OneToOne (related_name="summary")
                )
                .distinct()
                .order_by("date", "time")
                .first()
            )
            if pending_summary:
                lid = pending_summary.lesson_id
                return Response({
                    "next_action": "summary",
                    "lesson_id": lid,
                    "redirect_to": f"/summary/{lid}",
                })

            return Response({"next_action": None})

        return Response({"next_action": None})

class PaymentAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        # samo student
        if request.user.role != "STUDENT":
            return Response({"allowed": False}, status=status.HTTP_403_FORBIDDEN)

        # lesson
        try:
            lesson = Lesson.objects.get(lesson_id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"allowed": False}, status=status.HTTP_404_NOT_FOUND)

        student = getattr(request.user, "student", None)
        if not student:
            return Response({"allowed": False}, status=status.HTTP_404_NOT_FOUND)

        attendance = Attendance.objects.filter(lesson=lesson, student=student).first()
        if not attendance:
            return Response({"allowed": False}, status=status.HTTP_403_FORBIDDEN)

        # mora biti završen call
        if not getattr(attendance, "call_ended", False):
            return Response({"allowed": False, "redirect_to": f"/lesson/{lesson_id}/call"}, status=200)

        payment = Payment.objects.filter(attendance=attendance).first()
        if payment and payment.is_paid:
            # već plaćeno -> odmah na review
            return Response({"allowed": False, "redirect_to": f"/review/{lesson_id}"}, status=200)

        return Response({"allowed": True}, status=200)

class CompletePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        user = request.user

        if user.role != User.Role.STUDENT:
            return Response({"error": "Only students"}, status=403)

        session_id = request.data.get("session_id")
        if not session_id:
            return Response({"error": "Missing session_id"}, status=400)

        try:
            lesson = Lesson.objects.get(lesson_id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not found"}, status=404)

        student = getattr(user, "student", None)
        if not student:
            return Response({"error": "Student profile not found"}, status=404)

        attendance = Attendance.objects.filter(lesson=lesson, student=student).first()
        if not attendance:
            return Response({"error": "Forbidden"}, status=403)

        payment = Payment.objects.filter(attendance=attendance).first()
        if not payment:
            return Response({"error": "Payment record missing"}, status=404)

        # Stripe provjera
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status != "paid":
            return Response({"error": "Payment not completed"}, status=409)

        # (Opcionalno) dodatna provjera metadata
        # if str(session.metadata.get("lesson_id")) != str(lesson_id): ...

        payment.is_paid = True
        payment.save(update_fields=["is_paid"])

        return Response({"ok": True})


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
    "vrlo dobra": "teško",
    "odlična": "jako teško",
}

class StudentQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, subject_name: str):
        if request.user.role != "STUDENT":
            return Response(
                {"error": "Only students can access this endpoint"},
                status=403
            )

        try:
            student = Student.objects.get(student_id=request.user)
        except Student.DoesNotExist:
            return Response(
                {"error": "Student profile not found"},
                status=404
            )

        grade = student.grade
        school_level = student.school_level

        raw_knowledge = student.knowledge_level or {}

        # 🔥 NORMALIZACIJA ZNANJA U DICT
        knowledge = {}

        # 1️⃣ AKO JE DICT (novi format)
        if isinstance(raw_knowledge, dict):
            knowledge = raw_knowledge

        # 2️⃣ AKO JE LISTA (stari format)
        elif isinstance(raw_knowledge, list):
            for item in raw_knowledge:
                if not isinstance(item, dict):
                    continue
                subject = item.get("subject")
                level = item.get("level")
                if subject and level:
                    knowledge[subject] = level

        # 3️⃣ SAD SIGURNO IMAMO DICT
        level = knowledge.get(subject_name)
        if not level:
            return Response(
                {"error": "No knowledge level for this subject"},
                status=404
            )

        difficulty = KNOWLEDGE_TO_DIFFICULTY.get(level.lower())
        if not difficulty:
            return Response(
                {"error": "Invalid knowledge level"},
                status=400
            )

        questions = Question.objects.filter(
            subject__name__iexact=subject_name,
            grade=grade,
            school_level=school_level,
            difficulty=difficulty
        )

        serializer = StudentQuestionSerializer(questions, many=True)
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
        # samo instruktor
        if request.user.role != User.Role.INSTRUCTOR:
            return Response({"error": "Only instructors can upload summaries"}, status=403)

        # instructor profil
        try:
            instructor = Instructor.objects.get(instructor_id=request.user)
        except Instructor.DoesNotExist:
            return Response({"error": "Instructor profile not found"}, status=404)

        # lesson (kod tebe pk je lesson_id, ali ovako je jasnije i konzistentno)
        try:
            lesson = Lesson.objects.get(lesson_id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not found"}, status=404)

        # mora biti njegova lekcija
        if lesson.instructor_id.instructor_id != request.user:
            return Response({"error": "Forbidden"}, status=403)

        # mora biti call završen
        if not Attendance.objects.filter(lesson=lesson, call_ended=True).exists():
            return Response({"error": "Call not ended"}, status=403)

        # summary već postoji -> 409
        if Summary.objects.filter(lesson=lesson).exists():
            return Response({"error": "Summary already exists"}, status=409)

        # validacija podataka
        serializer = SummarySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            serializer.save(author=instructor, lesson=lesson)
        except IntegrityError:
            # safety net ako se desi race condition
            return Response({"error": "Summary already exists"}, status=409)

        return Response(serializer.data, status=201)
class SummaryAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        if request.user.role != User.Role.INSTRUCTOR:
            return Response({"allowed": False}, status=status.HTTP_403_FORBIDDEN)

        lesson = Lesson.objects.get(lesson_id=lesson_id)

        if lesson.instructor_id.instructor_id != request.user:
            return Response({"allowed": False}, status=status.HTTP_403_FORBIDDEN)

        # ✅ NOVO: call_ended mora biti True
        if not Attendance.objects.filter(lesson=lesson, call_ended=True).exists():
            return Response({"allowed": False, "redirect_to": f"/lesson/{lesson_id}/call"}, status=200)

        # ✅ ako summary već postoji
        if Summary.objects.filter(lesson=lesson).exists():
            return Response({"allowed": False, "redirect_to": "/home/instructor"}, status=200)

        return Response({"allowed": True}, status=200)

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
    


LEVELS = ["loša", "dovoljna", "dobra", "vrlo dobra", "odlična"]
DEFAULT_LEVEL = "dovoljna"

def knowledge_to_dict(value):
    
    if not value:
        return {}

    if isinstance(value, dict):
        return value

    if isinstance(value, list):
        # očekujemo npr. [{"subject": "Matematika", "level": "dobra"}, ...]
        out = {}
        for item in value:
            if isinstance(item, dict):
                subj = item.get("subject")
                lvl = item.get("level")
                if subj and lvl:
                    out[str(subj)] = str(lvl)
        return out

    return {}


class UpdateKnowledgeLevelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if getattr(user, "role", None) != "STUDENT":
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        subject = request.data.get("subject")
        action = request.data.get("action")  # upgrade / downgrade

        if not subject or action not in {"upgrade", "downgrade"}:
            return Response(
                {"error": "Required: subject and action ('upgrade' or 'downgrade')"},
                status=status.HTTP_400_BAD_REQUEST
            )

        student = Student.objects.get(student_id=user)

        knowledge = knowledge_to_dict(student.knowledge_level)

        current = knowledge.get(subject, DEFAULT_LEVEL)
        if current not in LEVELS:
            current = DEFAULT_LEVEL

        idx = LEVELS.index(current)
        if action == "upgrade" and current != 4:
            idx = min(len(LEVELS) - 1, idx + 1)
        elif action == "downgrade" and current != 0:
            idx = max(0, idx - 1)

        new_level = LEVELS[idx]
        knowledge[subject] = new_level

        # spremamo kao dict (preporučeni format)
        student.knowledge_level = knowledge
        student.save(update_fields=["knowledge_level"])

        return Response(
            {"subject": subject, "new_level": new_level, "all_levels": knowledge},
            status=status.HTTP_200_OK
        )
