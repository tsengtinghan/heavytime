"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestSupabasePage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult("Testing...");

    try {
      // Test 1: Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKeyExists = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      let log = "=== Supabase Connection Test ===\n\n";
      log += `Supabase URL: ${supabaseUrl || "❌ NOT SET"}\n`;
      log += `Supabase Key: ${
        supabaseKeyExists ? "✅ EXISTS" : "❌ NOT SET"
      }\n\n`;

      // Test 2: Try to fetch from story table
      log += "--- Testing SELECT ---\n";
      const { data: stories, error: selectError } = await supabase
        .from("story")
        .select("*")
        .limit(5);

      if (selectError) {
        log += `❌ SELECT Error: ${selectError.message}\n`;
        log += `Details: ${JSON.stringify(selectError, null, 2)}\n`;
      } else {
        log += `✅ SELECT Success: Found ${stories?.length || 0} stories\n`;
      }

      // Test 3: Try to insert a test story
      log += "\n--- Testing INSERT ---\n";
      const testStory = {
        title: "Test Story " + new Date().toISOString(),
        camera_image: "https://example.com/test.jpg",
        poem_text: "Test poem",
        poem_audio: null,
        comic_image: null,
      };

      const { data: newStory, error: insertError } = await supabase
        .from("story")
        .insert(testStory)
        .select()
        .single();

      if (insertError) {
        log += `❌ INSERT Error: ${insertError.message}\n`;
        log += `Code: ${insertError.code}\n`;
        log += `Details: ${JSON.stringify(insertError, null, 2)}\n`;
      } else {
        log += `✅ INSERT Success: Created story with ID ${newStory?.id}\n`;

        // Clean up - delete the test story
        if (newStory?.id) {
          await supabase.from("story").delete().eq("id", newStory.id);
          log += `✅ Test story deleted\n`;
        }
      }

      setResult(log);
    } catch (error) {
      setResult(
        `❌ Unexpected error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>

        <button
          onClick={testConnection}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
        >
          {loading ? "Testing..." : "Run Test"}
        </button>

        {result && (
          <pre className="bg-white p-6 rounded-lg shadow-lg whitespace-pre-wrap font-mono text-sm">
            {result}
          </pre>
        )}

        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="font-bold mb-2">⚠️ Important Notes:</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              Make sure <code className="bg-gray-200 px-1">.env.local</code>{" "}
              exists in project root
            </li>
            <li>
              Environment variables must start with{" "}
              <code className="bg-gray-200 px-1">NEXT_PUBLIC_</code>
            </li>
            <li>Restart dev server after adding environment variables</li>
            <li>
              Check Supabase RLS policies allow public insert/select on story
              table
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
