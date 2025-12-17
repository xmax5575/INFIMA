from rest_framework import status
from rest_framework.views import APIView
from profiles.serializers import InstructorUpdateSerializer, MyInstructorProfileSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from api.models import Instructor


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

        serializer = InstructorUpdateSerializer(
            instructor,
            data=request.data,
            partial=True  # dopušta slanje samo dijela polja
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

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