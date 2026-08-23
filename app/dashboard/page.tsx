import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login");
  }

  // Fetch the user's membership in an org
  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id, role, full_name, organizations(name)")
    .eq("user_id", userData.user.id)
    .single();

  if (membershipError || !membership) {
    redirect("/onboarding");
  }

  // Fetch the review cycles for the org
  const { data: cycles } = await supabase
    .from("review_cycles")
    .select("id, title, status, created_at")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false });

    // Fetch the assignments for the user
    const { data: myAssignments } = await supabase
  .from("cycle_participants")
  .select("id, submitted, subject_user_id, review_cycles(id, title, status)")
  .eq("reviewer_user_id", userData.user.id);

  const orgName = (membership.organizations as unknown as { name: string })?.name;

  return (
    <div className="max-w-2xl mx-auto mt-16 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">{orgName}</h1>
          <p className="text-xs text-gray-400 mt-1">Org ID: {membership.org_id}</p> {/*Display the org ID*/}
          <p className="text-sm text-gray-600">
            Logged in as {membership.full_name} ({membership.role})
          </p>
        </div>

        {membership.role !== "member" && (
          <Link
            href="/cycles/new"
            className="bg-black text-white rounded px-4 py-2 text-sm"
          >
            New review cycle
          </Link>
        )}
      </div>

      <h2 className="text-lg font-medium mb-4">Review cycles</h2>

      {!cycles || cycles.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No review cycles yet. {membership.role !== "member" && "Create one to get started."}
        </p>
      ) : (
        <ul className="space-y-3">
          {cycles.map((cycle) => (
           <li key={cycle.id} className="border rounded p-4">
  <div className="flex items-center justify-between">
    <Link href={`/cycles/${cycle.id}`} className="font-medium underline">
      {cycle.title}
    </Link>
    <span className="text-xs uppercase text-gray-500">
      {cycle.status}
    </span>
  </div>
</li>
          ))}
        </ul>
      )}
      
      {/* Feedback to give section */}
      <h2 className="text-lg font-medium mb-4 mt-10">Feedback to give</h2>

{!myAssignments || myAssignments.length === 0 ? (
  <p className="text-gray-500 text-sm">Nothing assigned to you yet.</p>
) : (
  <ul className="space-y-3">
    {myAssignments.map((a) => {
      const cycle = a.review_cycles as unknown as {
        id: string;
        title: string;
        status: string;
      };
      return (
        <li key={a.id} className="border rounded p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{cycle.title}</p>
            <p className="text-xs text-gray-500">
              {a.submitted ? "Submitted" : "Not submitted"}
            </p>
          </div>
          {cycle.status === "open" && !a.submitted && (
            <Link
              href={`/cycles/${cycle.id}/review/${a.id}`}
              className="bg-black text-white rounded px-3 py-1.5 text-sm"
            >
              Give feedback
            </Link>
          )}
        </li>
      );
    })}
  </ul>
)}
    </div>
  );
}