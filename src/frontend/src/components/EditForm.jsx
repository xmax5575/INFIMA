import { useState } from "react";
import InstructorEditForm from "./InstructorEditForm";
import StudentEditForm from "./StudentEditForm";

export default function EditForm({ role }) {
  if (role === "instructor") return <InstructorEditForm />;
  if (role === "student") return <StudentEditForm update ={Date.now()}/>;

  return null; 
}
