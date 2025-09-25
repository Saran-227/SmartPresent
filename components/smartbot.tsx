"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function SmartBot({ classId }: { classId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    setAnswer("");

    try {
      // 1️⃣ Fetch attendance data from Supabase
      const { data: records, error } = await supabase
        .from("attendance_sessions")
        .select("*, attendance_records(*, student:students(name))")
        .eq("class_id", classId);

      if (error) throw error;

      // 2️⃣ Prepare data to send to LLM
      const formattedData = JSON.stringify(records, null, 2);

      // 3️⃣ Ask OpenRouter AI with context
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000", // Change to your deployed URL later
          "X-Title": "SmartPresent AI Bot"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // ✅ Try "gpt-4o-mini", "mistralai/mistral-large", "meta-llama/llama-3.1-70b-instruct" etc.
          messages: [
            {
              role: "system",
              content: `You are SmartBot, a helpful assistant for teachers analyzing attendance data. 
              Use the provided student attendance data to answer questions with names, percentages, and insights.`
            },
            {
              role: "user",
              content: `Here is the attendance data: ${formattedData}\n\nQuestion: ${question}`
            }
          ],
        }),
      });

      const result = await res.json();
      const text = result?.choices?.[0]?.message?.content || "No answer generated.";
      setAnswer(text);

    } catch (err) {
      console.error("SmartBot error:", err);
      setAnswer("⚠️ Error fetching answer. Please check your API key or quota.");
    }

    setLoading(false);
  };

  return (
    <Card className="mt-6 bg-white border-orange-200">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-orange-600 flex items-center gap-2">
           SmartBot – Ask Your Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Ask something like: Which students have attendance below 70%?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button onClick={handleAsk} disabled={loading || !question}>
            {loading ? "Thinking..." : "Ask"}
          </Button>
        </div>

        {answer && (
          <div className="p-4 border rounded bg-orange-50 text-black whitespace-pre-line">
            {answer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
