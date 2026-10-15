
"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase";

const TASK_ID = "467f1cbd-b9d1-492b-a930-b6093734b311";

export default function CleanupTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function testCleanup() {
    setLoading(true);
    setResult(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Please log in to TaskUp before testing."
        );
      }

      const { data, error } = await supabase.functions.invoke(
        "cleanup-task-attachments---",
        {
          body: {
            taskId: TASK_ID,
          },
        }
      );

      if (error) {
        let message = error.message;

        if (error.context) {
          try {
            const details = await error.context.json();
            message = details.error || JSON.stringify(details);
          } catch {
            // Keep the original error message.
          }
        }

        throw new Error(message);
      }

      setResult(data);
    } catch (error) {
      setResult({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>TaskUp Attachment Cleanup Test</h1>

      <p>
        This test checks the deployed Edge Function.
        No files will be deleted.
      </p>

      <p>
        Task ID: {TASK_ID}
      </p>

      <button
        onClick={testCleanup}
        disabled={loading}
        style={{
          padding: "12px 24px",
          background: "#6d28d9",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        {loading ? "Testing..." : "Test Cleanup Function"}
      </button>

      {result && (
        <pre
          style={{
            marginTop: 24,
            padding: 20,
            background: "#f3f4f6",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            color: "#111827",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
