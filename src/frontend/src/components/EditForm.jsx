import InstructorEditForm from "./InstructorEditForm";
import StudentEditForm from "./StudentEditForm";

export default function EditForm({ role }) {
  if (role === "instructor") return <InstructorEditForm />;
  if (role === "student") return <StudentEditForm />;

  return null; // ili neki fallback UI
}
