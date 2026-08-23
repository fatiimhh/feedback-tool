"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Member {
  user_id: string;
  full_name: string;
}

interface Assignment {
  id: string;
  subject_user_id: string;
  reviewer_user_id: string;
}

export default function CycleDetailPage() {
  const params = useParams();
  const cycleId = params.id as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", userData.user.id)
      .single();

    if (!membership) return;

    const { data: orgMembers } = await supabase
      .from("org_members")
      .select("user_id, full_name")
      .eq("org_id", membership.org_id);

    setMembers(orgMembers ?? []);

    const { data: existingAssignments } = await supabase
      .from("cycle_participants")
      .select("id, subject_user_id, reviewer_user_id")
      .eq("cycle_id", cycleId);

    setAssignments(existingAssignments ?? []);
  }, [cycleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (subjectId === reviewerId) {
      setError("A person can't review themselves.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: insertError } = await supabase.from("cycle_participants").insert({
      cycle_id: cycleId,
      subject_user_id: subjectId,
      reviewer_user_id: reviewerId,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSubjectId("");
    setReviewerId("");
    setLoading(false);
    loadData();
  }

  function nameFor(userId: string) {
    return members.find((m) => m.user_id === userId)?.full_name ?? "Unknown";
  }

  return (
    <div className="max-w-xl mx-auto mt-16 p-6">
      <h1 className="text-2xl font-semibold mb-6">Assign reviewers</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleAssign} className="flex gap-2 items-end mb-8">
        <div className="flex-1">
          <label className="block text-sm mb-1">Person being reviewed</label>
          <select
            required
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Select...</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm mb-1">Reviewer</label>
          <select
            required
            value={reviewerId}
            onChange={(e) => setReviewerId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Select...</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          Assign
        </button>
      </form>

      <h2 className="text-lg font-medium mb-3">Current assignments</h2>
      {assignments.length === 0 ? (
        <p className="text-gray-500 text-sm">No assignments yet.</p>
      ) : (
        <ul className="space-y-2">
          {assignments.map((a) => (
            <li key={a.id} className="text-sm border rounded p-3">
              <strong>{nameFor(a.reviewer_user_id)}</strong> reviews{" "}
              <strong>{nameFor(a.subject_user_id)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}