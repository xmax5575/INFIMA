from rest_framework import generics, permissions
from api.models import Instructor
from .serializers import InstructorSerializer


# Ovo je jednostavan view koji samo gleda je li korisnik ulogiran, ako je, onda ovaj 
# get_object vraca instuktora i prilikom koristenja ovog viewa, kada se poziva u urls.py,
# koristi se InstructorSerializer iz serializers.py
class InstructorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = InstructorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Instruktor može pristupiti samo vlastitom profilu.
        Ako korisnik nije instruktor → 404 (sigurnije nego 403).
        """
        return Instructor.objects.get(instructor_id=self.request.user)