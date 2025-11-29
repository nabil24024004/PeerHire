import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch freelancer profile with skills
    const { data: freelancerProfile } = await supabaseClient
      .from("freelancer_profiles")
      .select("skills, total_jobs_completed")
      .eq("user_id", user.id)
      .single();

    // Fetch recent applications to understand preferences
    const { data: recentApplications } = await supabaseClient
      .from("job_applications")
      .select("job_id, jobs(work_type, subject)")
      .eq("freelancer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch all open jobs
    const { data: openJobs } = await supabaseClient
      .from("jobs")
      .select("id, title, description, work_type, subject, page_count, budget, deadline, quality_level")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!openJobs || openJobs.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context for AI
    const skills = freelancerProfile?.skills || [];
    const totalJobs = freelancerProfile?.total_jobs_completed || 0;
    const recentWorkTypes: string[] = [];
    const recentSubjects: string[] = [];
    
    if (recentApplications) {
      for (const app of recentApplications) {
        if (app.jobs) {
          const jobData = app.jobs as any;
          if (jobData.work_type) recentWorkTypes.push(jobData.work_type);
          if (jobData.subject) recentSubjects.push(jobData.subject);
        }
      }
    }

    const systemPrompt = `You are a job matching AI. Based on the freelancer's profile, recommend the most suitable jobs.
Consider:
- Skills match with job requirements
- Previous work experience (work types and subjects)
- Job complexity vs freelancer experience
- Budget appropriateness
Return ONLY the job IDs in order of best match.`;

    const userPrompt = `Freelancer Profile:
- Skills: ${skills.join(", ") || "None specified"}
- Completed jobs: ${totalJobs}
- Recent work types: ${[...new Set(recentWorkTypes)].join(", ") || "None"}
- Recent subjects: ${[...new Set(recentSubjects)].join(", ") || "None"}

Available Jobs:
${openJobs.map((job, idx) => `${idx + 1}. ID: ${job.id}
   Title: ${job.title}
   Description: ${job.description}
   Type: ${job.work_type}
   Subject: ${job.subject || "N/A"}
   Budget: $${job.budget}
   Quality: ${job.quality_level}
`).join("\n")}

Return the top 5-8 job IDs in order of best match for this freelancer.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_jobs",
              description: "Return recommended job IDs in order of best match",
              parameters: {
                type: "object",
                properties: {
                  job_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of job IDs in order of recommendation priority"
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why these jobs were recommended"
                  }
                },
                required: ["job_ids"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "recommend_jobs" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    const recommendedJobIds = args.job_ids || [];

    // Filter and order jobs based on AI recommendations
    const recommendations = recommendedJobIds
      .map((id: string) => openJobs.find(job => job.id === id))
      .filter(Boolean)
      .slice(0, 5); // Return top 5

    return new Response(
      JSON.stringify({ 
        recommendations,
        reasoning: args.reasoning 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
