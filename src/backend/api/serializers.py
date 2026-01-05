from datetime import datetime
from django.contrib.auth import get_user_model
from django.db.models import Avg
from rest_framework import serializers
from .models import Instructor, Lesson, Review, Subject, Student

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'password', 'email', 'role']
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': False}
        }

    def create(self, validated_data):
        # Ensure compatibility with Django's default UserManager.create_user
        # which expects a username parameter. We don't require a separate
        # username field, so use the email as the username value.
        email = validated_data.get('email') 

        if 'role' in validated_data and validated_data['role'] is None:
            del validated_data['role']

        # Use email as username so create_user doesn't raise missing username
        user = User.objects.create_user(username=email, **validated_data)
        return user
    
class LessonSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField(read_only=True)
    title = serializers.SerializerMethodField(read_only=True)
    instructor_display = serializers.SerializerMethodField(read_only=True)
    location = serializers.CharField(source="instructor_id.location", read_only=True)
    price = serializers.IntegerField(source="instructor_id.price", read_only=True)

    class Meta:
        model = Lesson
        # Uključujemo sva polja iz modela
        fields = '__all__'
        # instructor_id se ne smije mijenjati ručno izvana – određuje ga backend
        extra_kwargs = {
            'instructor_id': {'read_only': True},
        }

    def get_instructor_name(self, obj):
        """
        Metoda koja dohvaća ime i prezime instruktora.
        Ako instruktor ne postoji ili dođe do pogreške,
        vraća se tekst 'Nepoznati instruktor'.
        """
        try:
            first = obj.instructor_id.instructor_id.first_name
            last = obj.instructor_id.instructor_id.last_name
            return f"{first} {last}".strip()
        except Exception:
            return "Nepoznati instruktor"

    def get_title(self, obj):
        """
        Naslov lekcije – trenutno jednak imenu instruktora.
        """
        return self.get_instructor_name(obj)

    def get_instructor_display(self, obj):
        """
        Formatiran prikaz instruktora – također se vraća isto ime.
        Može se kasnije proširiti (npr. dodati titulu, predmet i sl.).
        """
        return self.get_instructor_name(obj)
    
class InstructorUpdateSerializer(serializers.ModelSerializer):
    # omogućava odabir više predmeta
    subjects = serializers.SlugRelatedField(
        many=True,
        queryset=Subject.objects.all(),
        slug_field='name'  
    )

    class Meta:
        model = Instructor
        # uključujemo samo polja koja želimo da instruktor može mijenjati
        fields = ['bio',
                  'location', 
                  'price', 
                  'subjects',
                  'video_url'
        ]


ALLOWED_SUBJECTS = {"Matematika", "Fizika", "Informatika"}
ALLOWED_LEVELS = {"loša", "dovoljna", "dobra", "vrlo_dobra", "odlična"}
ALLOWED_SCHOOL_LEVELS = {"osnovna", "srednja"}

class StudentUpdateSerializer(serializers.ModelSerializer):
    # omogućava odabir više instruktora
    favorite_instructors = serializers.PrimaryKeyRelatedField(
    many=True,
    queryset=Instructor.objects.all(),
    required=False
)


    class Meta:
        model = Student
        # uključujemo samo polja koja želimo da student može mijenjati
        fields = [
            'school_level',
            'grade',
            'knowledge_level',
            'learning_goals', 
            'preferred_times', 
            'notifications_enabled',
            'favorite_instructors'
        ]
    #validacija school_level
    def validate_school_level(self, value):
        if value is None:
            return value
        if value not in ALLOWED_SCHOOL_LEVELS:
            raise serializers.ValidationError("school_level must be 'osnovna' or 'srednja'")
        return value
    # validacija knowledge_level
    def validate_knowledge_level(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("knowledge_level must be a list")
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each knowledge_level item must be an object")
            subject = item.get("subject")
            level = item.get("level")
            if subject not in ALLOWED_SUBJECTS:
                raise serializers.ValidationError(f"Unknown subject: {subject}")
            if level not in ALLOWED_LEVELS:
                raise serializers.ValidationError(f"Unknown level: {level}")
        return value

    # validacija preferred_times
    def validate_preferred_times(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Preferred_times must be a list")
        
        for slot in value:
            if not isinstance(slot, dict):
                raise serializers.ValidationError("Each slot must be a dict with day, start, end")
            if "day" not in slot or "start" not in slot or "end" not in slot:
                raise serializers.ValidationError("Each slot must have day, start, end keys")

            # Provjera formata vremena HH:MM
            try:
                start = datetime.strptime(slot["start"], "%H:%M").time()
                end = datetime.strptime(slot["end"], "%H:%M").time()
            except ValueError:
                raise serializers.ValidationError("start and end must be in HH:MM format")

            if end <= start:
                raise serializers.ValidationError("end time must be after start time")
        
        return value

class SubjectMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["subject_id", "name"]

class ReviewMiniSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ["id", "student_name", "rating", "description"]

    def get_student_name(self, obj):
        if obj.student:
            first = obj.student.first_name or ""
            last = obj.student.last_name or ""
            name = f"{first} {last}".strip()
            return name if name else "Anonimno"
        return "Anonimno"

class CalendarLessonSerializer(serializers.ModelSerializer):
    subject_name = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "lesson_id",
            "date",
            "time",
            "location",
            "format",
            "duration_min",
            "is_available",
            "price",
            "subject_name",
        ]

    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None


class MyInstructorProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="instructor_id_id", read_only=True)
    full_name = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    calendar = serializers.SerializerMethodField()
    subjects = SubjectMiniSerializer(many=True, read_only=True)
    price_eur = serializers.IntegerField(source="price", read_only=True)

    class Meta:
        model = Instructor
        fields = [
            "id",
            "full_name",
            "bio",
            "location",
            "subjects",
            "price_eur",
            "video_url",
            "avg_rating",
            "reviews",
            "calendar",
        ]

    def get_full_name(self, obj):
        u = obj.instructor_id
        first = getattr(u, "first_name", "") or ""
        last = getattr(u, "last_name", "") or ""
        return f"{first} {last}".strip()

    def get_avg_rating(self, obj):
        # prosjek samo po recenzijama koje imaju rating
        qs = Review.objects.filter(instructor=obj, rating__isnull=False)
        val = qs.aggregate(a=Avg("rating"))["a"]
        return round(val, 2) if val is not None else None

    def get_reviews(self, obj):
        qs = Review.objects.filter(instructor=obj).order_by("-id")
        return ReviewMiniSerializer(qs, many=True).data

    def get_calendar(self, obj):
        # dostupni termini instruktora
        qs = Lesson.objects.filter(
            instructor_id=obj,
            is_available=True
        ).order_by("date", "time")
        return CalendarLessonSerializer(qs, many=True).data
    
class FavoriteInstructorMiniSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="instructor_id.first_name", read_only=True)
    last_name = serializers.CharField(source="instructor_id.last_name", read_only=True)

    class Meta:
        model = Instructor
        fields = ["instructor_id", "first_name", "last_name"]


class StudentProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="student_id.first_name", read_only=True)
    last_name = serializers.CharField(source="student_id.last_name", read_only=True)
    favorite_instructors = FavoriteInstructorMiniSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = [
            "first_name",
            "last_name",
            "school_level",
            "grade",
            "knowledge_level",
            "learning_goals",
            "preferred_times",
            "notifications_enabled",
            "favorite_instructors"
        ]


class InstructorListSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="instructor_id.id", read_only=True)
    first_name = serializers.CharField(source="instructor_id.first_name", read_only=True)
    last_name = serializers.CharField(source="instructor_id.last_name", read_only=True)

    class Meta:
        model = Instructor
        fields = ["id", "first_name", "last_name"]