from rest_framework import serializers
from api.models import Instructor

# Serializer za instruktora, prilikom get requesta vraća se svaki od ovih fieldova koji se pak dohvaćaju
# iz baze podataka, po istoimenim atributima iz modela, instruktor id i rating su read only jer se 
# ni ne bi smjeli mijenjati POST requestovima
class InstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instructor
        fields = [
            "instructor_id",
            "bio",
            "location",
            "price",
            "rating",
            "subject",
        ]
        read_only_fields = ["instructor_id", "rating"]