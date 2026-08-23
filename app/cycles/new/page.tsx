"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface QuestionDraft {
  prompt: string;
  question_type: "rating" | "text";
}

export default function NewCyclePage() {
  const [title, setTitle] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { prompt: "", question_type: "rating" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function updateQuestion(index: number, field: keyof QuestionDraft, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, { prompt: "", question_type: "rating" }]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (questions.some((q) => !q.prompt.trim())) {
      setError("Every question needs text before you can create the cycle.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    // Find the user's org
    const { data: membership, error: membershipError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", userData.user.id)
      .single();

    if (membershipError || !membership) {
      setError("Could not find your organization.");
      setLoading(false);
      return;
    }

    // Create the cycle
    const { data: cycle, error: cycleError } = await supabase
      .from("review_cycles")
      .insert({
        org_id: membership.org_id,
        title,
        is_anonymous: isAnonymous,
        status: "draft",
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (cycleError || !cycle) {
      setError(cycleError?.message ?? "Could not create cycle.");
      setLoading(false);
      return;
    }

    // Insert the questions, preserving order
    const questionRows = questions.map((q, index) => ({
      cycle_id: cycle.id,
      prompt: q.prompt,
      question_type: q.question_type,
      order_index: index,
    }));

    const { error: questionsError } = await supabase
      .from("cycle_questions")
      .insert(questionRows);

    if (questionsError) {
      setError(questionsError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <div className="max-w-xl mx-auto mt-16 p-6">
      <h1 className="text-2xl font-semibold mb-6">New review cycle</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleCreate} className="space-y-6">
        <div>
          <label className="block text-sm mb-1">Cycle title</label>
          <input
            type="text"
            required
            placeholder="e.g. Q3 2026 Peer Review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          <label htmlFor="anonymous" className="text-sm">
            Make responses anonymous
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Questions</label>
            <button
              type="button"
              onClick={addQuestion}
              className="text-sm underline"
            >
              + Add question
            </button>
          </div>

          <div className="space-y-3">
            {questions.map((q, index) => (
              <div key={index} className="flex gap-2 items-start">
                <input
                  type="text"
                  required
                  placeholder="Question prompt"
                  value={q.prompt}
                  onChange={(e) => updateQuestion(index, "prompt", e.target.value)}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                />
                <select
                  value={q.question_type}
                  onChange={(e) =>
                    updateQuestion(index, "question_type", e.target.value)
                  }
                  className="border rounded px-2 py-2 text-sm"
                >
                  <option value="rating">Rating</option>
                  <option value="text">Text</option>
                </select>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="text-red-600 text-sm px-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create cycle"}
        </button>
      </form>
    </div>
  );
}