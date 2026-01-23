#datetime
from datetime import datetime
# Django
from django.contrib.auth import get_user_model
from django.db.models import Avg
# DRF
from rest_framework import serializers
#models
from .models import Instructor, Lesson, Review, Subject, Student, Question, Summary
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'password', 'email', 'role']
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': False}
        }

    def create(self, validated_data):
        email = validated_data.get('email') 

        if 'role' in validated_data and validated_data['role'] is None:
            del validated_data['role']

        allowed = set(self.Meta.fields) - {'id'}
        filtered_data = {k: v for k, v in validated_data.items() if k in allowed}

        # Koristi email kao `username` kako create_user ne bi bacio grešku o nedostajućem usernameu
        user = User.objects.create_user(username=email, **filtered_data)
        return user
    
class LessonSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField(read_only=True)
    title = serializers.SerializerMethodField(read_only=True)
    instructor_display = serializers.SerializerMethodField(read_only=True)
    avg_rating = serializers.SerializerMethodField(read_only=True)
    location = serializers.CharField(source="instructor_id.location", read_only=True)
    price = serializers.IntegerField(source="instructor_id.price", read_only=True)
    subject = serializers.SlugRelatedField(
        slug_field="name",
        queryset=Subject.objects.all(),
        required=False,
        allow_null=True
    )

    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True
    )

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
        Naslov lekcije je formatiran kao "Predmet - Ime Instruktora".
        """
        return self.get_instructor_name(obj)

    def get_instructor_display(self, obj):
        """
        Formatiran prikaz instruktora
        """
        return self.get_instructor_name(obj)

    def get_avg_rating(self, obj):
        # prosjek samo po recenzijama koje imaju rating
        qs = Review.objects.filter(instructor=obj.instructor_id, rating__isnull=False)
        val = qs.aggregate(a=Avg("rating"))["a"]
        return round(val, 2) if val is not None else None
    

ALLOWED_SUBJECTS = {"Matematika", "Fizika", "Informatika"}
ALLOWED_LEVELS = {"loša", "dovoljna", "dobra", "vrlo dobra", "odlična"}
ALLOWED_SCHOOL_LEVELS = {"osnovna", "srednja"}

# Serializer za kreiranje ili update profila instruktora
class InstructorUpdateSerializer(serializers.ModelSerializer):
    # omogućava odabir više predmeta
    subjects = serializers.SlugRelatedField(
        many=True,
        queryset=Subject.objects.all(),
        slug_field='name'  
    )
    price_eur = serializers.IntegerField(source='price', required=False, allow_null=True)

    class Meta:
        model = Instructor
        # uključujemo samo polja koja želimo da instruktor može mijenjati
        fields = ['bio',
                  'location', 
                  'price_eur', 
                  'subjects',
                  'video_url',
                  'profile_image_url'
        ]

    def validate_subjects(self, value):
        if len(value) > 3:
            raise serializers.ValidationError("Instruktor ne smije dodati više od 3 predmeta.")
        for s in value:
            if s.name not in ALLOWED_SUBJECTS:
                raise serializers.ValidationError(f"Predmet {s.name} nije dozvoljen.")
        return value

# Serializer za kreiranje ili update profila studenta
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
            'favorite_instructors',
            'profile_image_url'
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
        if obj.student and obj.student.student_id:
            u = obj.student.student_id
            name = f"{u.first_name} {u.last_name}".strip()
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

#serializer za dohvaćanje informacija o instruktoru
class MyInstructorProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="instructor_id_id", read_only=True)
    full_name = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    calendar = serializers.SerializerMethodField()
    subjects = SubjectMiniSerializer(many=True, read_only=True)
    price_eur = serializers.IntegerField(source="price", read_only=True)
    google_calendar_email = serializers.EmailField(read_only=True)

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
            "profile_image_url",
            "avg_rating",
            "reviews",
            "calendar",
            "google_calendar_email",  
        ]


    def get_full_name(self, obj):
        u = obj.instructor_id
        first = getattr(u, "first_name", "") or ""
        last = getattr(u, "last_name", "") or ""
        return f"{first} {last}".strip()

    def get_avg_rating(self, obj):  #izračun prosječnog ratinga
        qs = Review.objects.filter(instructor=obj, rating__isnull=False)
        val = qs.aggregate(a=Avg("rating"))["a"]
        return round(val, 2) if val is not None else None

    def get_reviews(self, obj):
        qs = Review.objects.filter(instructor=obj).order_by("-id")
        return ReviewMiniSerializer(qs, many=True).data

    def get_calendar(self, obj):    #dostupni termini instruktora
        qs = Lesson.objects.filter(
            instructor_id=obj,
            is_available=True
        ).order_by("date", "time")
        return CalendarLessonSerializer(qs, many=True).data

#serializer za dodavanje favorite instruktora   
class FavoriteInstructorMiniSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="instructor_id.first_name", read_only=True)
    last_name = serializers.CharField(source="instructor_id.last_name", read_only=True)

    class Meta:
        model = Instructor
        fields = ["instructor_id", "first_name", "last_name"]

#serializer za dohvaćnje informacija o studentu
class StudentProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="student_id_id", read_only=True)
    first_name = serializers.CharField(source="student_id.first_name", read_only=True)
    last_name = serializers.CharField(source="student_id.last_name", read_only=True)
    favorite_instructors = FavoriteInstructorMiniSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "first_name",
            "last_name",
            "school_level",
            "grade",
            "knowledge_level",
            "learning_goals",
            "preferred_times",
            "notifications_enabled",
            "favorite_instructors",
            "profile_image_url"
        ]

#serializer za dohvaćnje svih instruktora
class InstructorListSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="instructor_id.id", read_only=True)
    first_name = serializers.CharField(source="instructor_id.first_name", read_only=True)
    last_name = serializers.CharField(source="instructor_id.last_name", read_only=True)

    class Meta:
        model = Instructor
        fields = ["id", "first_name", "last_name"]

class AttendanceCreateSerializer(serializers.Serializer):
    lesson_id = serializers.IntegerField()

#serializer za recenzije
class InstructorReviewSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student.student_id_id", read_only=True)
    student_first_name = serializers.CharField(source="student.student_id.first_name", read_only=True)
    student_last_name = serializers.CharField(source="student.student_id.last_name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "rating",
            "description",
            "student_id",
            "student_first_name",
            "student_last_name",
        ]

# Serializer za kreiranje i validaciju pojedinačnog pitanja
class QuestionSerializer(serializers.ModelSerializer):
    subject = serializers.SlugRelatedField(
        slug_field="name",
        queryset=Subject.objects.all()
    )

    class Meta:
        model = Question
        fields = [
            "id",
            "subject",
            "school_level",
            "grade",
            "difficulty",
            "type",
            "text",
            "points",
            "options",
            "correct_answer",
        ]

    def validate(self, data):
        qtype = data.get("type")
        options = data.get("options", [])
        answer = data.get("correct_answer")

        if qtype == "true_false":
            if answer is None or not isinstance(answer, bool):
                raise serializers.ValidationError(
                    "True/False question requires boolean correct_answer"
                )

        elif qtype == "multiple_choice":
            if not options or not isinstance(options, list):
                raise serializers.ValidationError(
                    "Multiple choice requires options list"
                )
            if answer is None:
                raise serializers.ValidationError(
                    "Multiple choice requires correct_answer"
                )
            if answer not in options:
                raise serializers.ValidationError(
                    "correct_answer must be one of options"
                )

        elif qtype == "short_answer":
            if answer is None or not isinstance(answer, str) or not answer.strip():
                raise serializers.ValidationError(
                    "Short answer requires text correct_answer"
                )

        else:
            raise serializers.ValidationError("Unknown question type")

        return data
    
# Serializer za upload više pitanja odjednom
class QuestionBulkSerializer(serializers.Serializer):
    questions = QuestionSerializer(many=True)

# Serializer za prikaz pitanja studenta u kvizu
class StudentQuestionSerializer(serializers.ModelSerializer):
    subject = serializers.SlugRelatedField(
        slug_field="name",
        read_only=True
    )

    class Meta:
        model = Question
        fields = [
            "id",
            "subject",
            "school_level",
            "grade",
            "difficulty",
            "type",
            "text",
            "points",
            "options",
            "correct_answer",
        ]

# Serializer za kreiranje i prikaz summary-ja lekcije
class SummarySerializer(serializers.ModelSerializer):
    lesson_date = serializers.DateField(source="lesson.date", read_only=True)
    lesson_subject = serializers.CharField(source="lesson.subject.name", read_only=True)

    class Meta:
        model = Summary
        fields = [
            "id",
            "lesson",
            "file_url",
            "file_name",       
            "lesson_date",     
            "lesson_subject", 
        ]
        read_only_fields = ["id", "lesson", "lesson_date", "lesson_subject"]
