import Header from "../components/Header";
import EditForm from "../components/EditForm";

function Profile({ role }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] flex flex-col pt-10">
      <Header />

      <main className="flex-1 flex items-start justify-center px-4 pt-20">
        <EditForm role={role} />
      </main>
    </div>
  );
}

export default Profile;
