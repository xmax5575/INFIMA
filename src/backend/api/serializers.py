from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Lesson, Instructor, Subject

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