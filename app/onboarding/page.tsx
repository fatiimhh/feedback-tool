"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("pending_full_name");
    if (saved) setFullName(saved);
  }, []);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("You must be logged in to create an organization.");
      setLoading(false);
      return;
    }

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName, owner_id: userData.user.id })
      .select()
      .single();

    if (orgError || !org) {
      setError(orgError?.message ?? "Could not create organization.");
      setLoading(false);
      return;
    }

// Add the user as a member of the organization
    const { error: memberError } = await supabase.from("org_members").insert({
      org_id: org.id,
      user_id: userData.user.id,
      role: "owner",
      full_name: fullName,
    });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    localStorage.removeItem("pending_full_name");
    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6">
      <h1 className="text-2xl font-semibold mb-2">Set up your organization</h1>
      <p className="text-sm text-gray-600 mb-6">
        This is the workspace your team will use for review cycles.
      </p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleCreateOrg} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Your name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Organization name</label>
          <input
            type="text"
            required
            placeholder="e.g. Acme Inc."
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create organization"}
        </button>
      </form>
    </div>
  );
}