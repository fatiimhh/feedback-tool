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
    </div>
  );
}