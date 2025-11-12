from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Lesson

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
        fields = '__all__'
        extra_kwargs = {
            'instructor_id': {'read_only': True},
        }

    def get_instructor_name(self, obj):
        try:
            first = obj.instructor_id.instructor_id.first_name
            last = obj.instructor_id.instructor_id.last_name
            return f"{first} {last}".strip()
        except Exception:
            return "Nepoznati instruktor"

    def get_title(self, obj):
        return self.get_instructor_name(obj)

    def get_instructor_display(self, obj):
        return self.get_instructor_name(obj)