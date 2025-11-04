from django.contrib.auth import get_user_model
from rest_framework import serializers

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
        
        # Remove role if it's None to prevent validation errors
        if 'role' in validated_data and validated_data['role'] is None:
            del validated_data['role']

        # Use email as username so create_user doesn't raise missing username
        user = User.objects.create_user(username=email, **validated_data)
        return user