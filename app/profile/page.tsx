import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getUserProfile } from "@/actions/profile";
import Layout from "@/components/Layout";
import ProfileClient from "@/components/ProfileClient";

const metadata = {
  title: "Profile Settings | Maze Bank",
  description: "Manage your profile and security settings",
};

export { metadata };

/**
 * Profile Settings page — server component
 * Fetches user profile and passes to client component
 */
export default async function ProfilePage() {
  // Verify session
  const session = await getSession();
  if (!session) redirect("/login");

  // Get user profile
  const profileResult = await getUserProfile();
  if (profileResult.error || !profileResult.user) {
    redirect("/login");
  }

  return (
    <Layout userName={profileResult.user.name} isAdmin={profileResult.user.role === "admin"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and security</p>
        </div>

        <ProfileClient userProfile={profileResult.user} />
      </div>
    </Layout>
  );
}
