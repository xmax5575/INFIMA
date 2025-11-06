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

        # Redirect depending on request type
        if request.content_type == 'application/json':
            return Response({'role': user.role}, status=status.HTTP_200_OK)
        else:
            return redirect('home')  # redirect to homepage/dashboard

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
                return redirect('/api/select-role/')
        
        return response
