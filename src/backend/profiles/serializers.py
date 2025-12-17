from rest_framework import serializers
from api.models import Instructor, Subject, Review, Lesson
from django.db.models import Avg



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