"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SummaryRow {
  subject_user_id: string;
  question_id: string;
  prompt: string;
  question_type: "rating" | "text";
  avg_rating: number | null;
  rating_count: number;
  text_responses: string[] | null;
}

interface Member {
  user_id: string;
  full_name: string;
}

export default function ResultsPage() {
  const params = useParams();
  const cycleId = params.id as string;

  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    const supabase = createClient();

    const { data: summaryData, error: summaryError } = await supabase
      .from("cycle_response_summary")
      .select("*")
      .eq("cycle_id", cycleId);

    if (summaryError) {
      setError(summaryError.message);
      setLoading(false);
      return;
    }

    setSummary(summaryData ?? []);

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: membership } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("user_id", userData.user.id)
        .single();

      if (membership) {
        const { data: orgMembers } = await supabase
          .from("org_members")
          .select("user_id, full_name")
          .eq("org_id", membership.org_id);
        setMembers(orgMembers ?? []);
      }
    }

    setLoading(false);
  }, [cycleId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  function nameFor(userId: string) {
    return members.find((m) => m.user_id === userId)?.full_name ?? "Unknown";
  }

  // Group the summary rows by subject_user_id
  const bySubject = summary.reduce<Record<string, SummaryRow[]>>((acc, row) => {
    acc[row.subject_user_id] = acc[row.subject_user_id] ?? [];
    acc[row.subject_user_id].push(row);
    return acc;
  }, {});

  if (loading) {
    return <p className="text-center mt-20 text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-16 p-6">
      <h1 className="text-2xl font-semibold mb-2">Results</h1>
      <p className="text-sm text-gray-600 mb-8">
        Individual reviewers are never identified — only aggregated answers.
      </p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {Object.keys(bySubject).length === 0 ? (
        <p className="text-gray-500 text-sm">No responses submitted yet.</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(bySubject).map(([subjectId, rows]) => (
            <div key={subjectId} className="border rounded p-5">
              <h2 className="font-medium mb-4">{nameFor(subjectId)}</h2>

              <div className="space-y-4">
                {rows.map((row) => (
                  <div key={row.question_id}>
                    <p className="text-sm font-medium mb-1">{row.prompt}</p>
                    {row.question_type === "rating" ? (
                      <p className="text-sm text-gray-600">
                        Average: {row.avg_rating?.toFixed(1) ?? "—"} / 5{" "}
                        <span className="text-xs">
                          ({row.rating_count} response
                          {row.rating_count !== 1 ? "s" : ""})
                        </span>
                      </p>
                    ) : (
                      <ul className="text-sm text-gray-600 space-y-1">
                        {row.text_responses?.map((t, i) => (
                          <li key={i} className="border-l-2 pl-2">
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}