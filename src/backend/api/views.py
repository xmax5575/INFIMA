from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.shortcuts import redirect

User = get_user_model()

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

class CheckUserRoleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        if request.user.is_authenticated:
            # Exclude the role selection page and API endpoints from the redirect
            if not request.path.startswith('/api/') and \
               not request.path.startswith('/select-role/') and \
               not request.user.has_role:
                return redirect('/select-role/')
        
        return response
