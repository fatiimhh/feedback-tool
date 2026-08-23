"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  prompt: string;
  question_type: "rating" | "text";
  order_index: number;
}

export default function SubmitReviewPage() {
  const params = useParams();
  const cycleId = params.id as string;
  const participantId = params.participantId as string;
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const loadQuestions = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("cycle_questions")
      .select("id, prompt, question_type, order_index")
      .eq("cycle_id", cycleId)
      .order("order_index", { ascending: true });

    setQuestions(data ?? []);
    setLoadingQuestions(false);
  }, [cycleId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  function updateAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (questions.some((q) => !answers[q.id]?.trim())) {
      setError("Please answer every question.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const responseRows = questions.map((q) => ({
      participant_id: participantId,
      question_id: q.id,
      rating_value: q.question_type === "rating" ? Number(answers[q.id]) : null,
      text_value: q.question_type === "text" ? answers[q.id] : null,
    }));

    const { error: insertError } = await supabase.from("responses").insert(responseRows);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // to mark the participant as submitted
    const { error: updateError } = await supabase
      .from("cycle_participants")
      .update({ submitted: true })
      .eq("id", participantId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  }

  if (loadingQuestions) {
    return <p className="text-center mt-20 text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-xl mx-auto mt-16 p-6">
      <h1 className="text-2xl font-semibold mb-6">Give feedback</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q) => (
          <div key={q.id}>
            <label className="block text-sm mb-2">{q.prompt}</label>

            {q.question_type === "rating" ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateAnswer(q.id, String(n))}
                    className={`w-10 h-10 rounded border text-sm ${
                      answers[q.id] === String(n)
                        ? "bg-black text-white"
                        : "bg-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={3}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit feedback"}
        </button>
      </form>
    </div>
  );
}