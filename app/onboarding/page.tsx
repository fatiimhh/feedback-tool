"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("pending_full_name");
    if (saved) setFullName(saved);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    if (mode === "create") {
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
    } else {
      // Joining an existing org
      const { error: memberError } = await supabase.from("org_members").insert({
        org_id: orgId,
        user_id: userData.user.id,
        role: "member",
        full_name: fullName,
      });

      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }
    }

    localStorage.removeItem("pending_full_name");
    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6">
      <h1 className="text-2xl font-semibold mb-6">Set up your account</h1>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 py-2 rounded text-sm ${
            mode === "create" ? "bg-black text-white" : "bg-gray-100"
          }`}
        >
          Create organization
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`flex-1 py-2 rounded text-sm ${
            mode === "join" ? "bg-black text-white" : "bg-gray-100"
          }`}
        >
          Join organization
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {mode === "create" ? (
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
        ) : (
          <div>
            <label className="block text-sm mb-1">Organization ID</label>
            <input
              type="text"
              required
              placeholder="Paste the org ID your manager shared"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "create" ? "Create organization" : "Join organization"}
        </button>
      </form>
    </div>
  );
}