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
    instructor_first_name = serializers.CharField(
        source='instructor_id.instructor_id.first_name', read_only=True
    )
    instructor_last_name = serializers.CharField(
        source='instructor_id.instructor_id.last_name', read_only=True
    )

    class Meta:
        model = Lesson
        fields = '__all__'  # includes all model fields + these two
