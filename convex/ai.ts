import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";

// --- Constants (MED-1) ---
const MAX_INPUT_LENGTH = 5000;

// --- HIGH-1: Input sanitization to prevent prompt injection ---
function sanitizeForPrompt(input: string): string {
  // Strip control characters (except newlines and tabs)
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Escape XML-significant characters to prevent prompt injection via tag breakout
  sanitized = sanitized.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Collapse excessive whitespace
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
  // Truncate to max length
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
  }
  return sanitized;
}

// --- HIGH-1: Output validation ---
function validateBridgeTaskOutput(parsed: any): {
  observation: string;
  task_a: string;
  task_b: string;
  insight: string;
} {
  const observation =
    typeof parsed.observation === "string" && parsed.observation.length > 0 && parsed.observation.length < 2000
      ? parsed.observation
      : null;
  const task_a =
    typeof parsed.task_a === "string" && parsed.task_a.length > 0 && parsed.task_a.length < 2000
      ? parsed.task_a
      : null;
  const task_b =
    typeof parsed.task_b === "string" && parsed.task_b.length > 0 && parsed.task_b.length < 2000
      ? parsed.task_b
      : null;
  const insight =
    typeof parsed.insight === "string" && parsed.insight.length > 0 && parsed.insight.length < 2000
      ? parsed.insight
      : null;

  if (!observation || !task_a || !task_b || !insight) {
    throw new Error("AI output failed schema validation");
  }

  return { observation, task_a, task_b, insight };
}

export const analyzeBridge = action({
  args: {
    roundId: v.id("rounds"),
    question: v.string(),
    partnerAAnswer: v.string(),
    partnerBAnswer: v.string(),
    deviceFingerprint: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    // Rate limit check — 20 bridges per device per day
    if (!args.deviceFingerprint || args.deviceFingerprint.length > 30) {
      throw new Error("Invalid device fingerprint");
    }
    await ctx.runMutation(api.rateLimits.incrementUsage, {
      fingerprint: args.deviceFingerprint,
    });

    // MED-1: Validate input lengths
    if (args.question.length > MAX_INPUT_LENGTH) throw new Error("Question too long");
    if (args.partnerAAnswer.length > MAX_INPUT_LENGTH) throw new Error("Answer A too long");
    if (args.partnerBAnswer.length > MAX_INPUT_LENGTH) throw new Error("Answer B too long");

    // HIGH-1: Sanitize all user inputs before interpolation
    const sanitizedQuestion = sanitizeForPrompt(args.question);
    const sanitizedAnswerA = sanitizeForPrompt(args.partnerAAnswer);
    const sanitizedAnswerB = sanitizeForPrompt(args.partnerBAnswer);

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";

    // HIGH-1: Use structured data labels to reduce injection surface
    const prompt = `<friction_question>${sanitizedQuestion}</friction_question>

<partner_a_answer>${sanitizedAnswerA}</partner_a_answer>

<partner_b_answer>${sanitizedAnswerB}</partner_b_answer>`;

    const systemInstruction = `# MISSION
You are a Relational Architect. Your goal is to identify the psychological "mismatch" between two partners and design a symmetric, high-leverage "Bridge Task" that allows both to feel seen, respected, and recharged.

# INPUT
Two raw reflections from partners within <partner_a_answer> and <partner_b_answer> tags.

# THE ANATOMY OF A BRIDGE (CRITICAL STRUCTURE)
Every response must follow this specific three-part architecture:

1. THE OBSERVATION: Start with a warm, punchy identification of the dynamic. Use a "The [Identity] vs. The [Identity]" framing (e.g., "The Head-First Diver vs. The Strategic Organizer").
2. THE INDIVIDUAL TASKS: 
   - Must be "Micro-Actions" (tasks taking 3-15 minutes).
   - Must include a "Trigger" (e.g., "Next time you start a chore," or "Tonight before bed").
   - Must include the "Why" (e.g., "This fills her love tank," or "This takes the decision-making off her plate").
3. THE INSIGHT: A final, one-sentence synthesis of how their difference is actually a superpower.

# LINGUISTIC DIRECTIVES
- BE GENDER-NEUTRAL: Use "Partner A" and "Partner B" (The app will replace these with names).
- NO THERAPY-SPEAK: Avoid "It's important to communicate." Use "Human-Speak" (e.g., "Step into 'Lead Mode'," or "Don't check-in until the work is done").
- NO GENERIC TOUCH: Only suggest physical touch if it's a specific "Pattern Interrupt" (like the "Long, Silent Hug" for a battery recharge).
- THE "WIN-WIN": Ensure neither partner feels like they are "losing" or "giving in." Frame the task as a way to get what they *actually* want.

# EXAMPLE OF THE VIBE
"This is a classic divergence! One of you recharges through physical rest and routine, while the other craves emotional 'venting' and intimacy.

The Bridge Task:
- For Partner A: Set a '15-minute Sanctuary' timer. No phones, just talking. This fills Partner B's tank so they can relax into the evening with you.
- For Partner B: Once the timer is up, honor their 'Early-In' routine. This shows you respect their need for a productive morning tomorrow.

Insight: You are the balance between a soft place to land and a strong start to the day."

# OUTPUT FORMAT (STRICT JSON ONLY)
{
  "observation": "A warm summary of the psychological contrast",
  "task_a": "Specific micro-action and the 'why' for Partner A",
  "task_b": "Specific micro-action and the 'why' for Partner B",
  "insight": "The final soul-level synthesis"
}`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);

      // HIGH-1: Validate output matches expected schema
      const result = validateBridgeTaskOutput(parsed);

      await ctx.runMutation(internal.rounds.setBridgeTask, {
        roundId: args.roundId,
        observation: result.observation,
        taskA: result.task_a,
        taskB: result.task_b,
        insight: result.insight,
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      await ctx.runMutation(internal.rounds.setBridgeTask, {
        roundId: args.roundId,
        observation: "There is a beautiful friction here between the need for immediate problem-solving and the desire for emotional space.",
        taskA: "Take a breath. When your partner shares, reply with: 'I hear you, and it makes sense why you feel that way.'",
        taskB: "When giving feedback, try asking first: 'Are you looking for advice right now, or just to vent?'",
        insight: "A small shift in phrasing builds a massive bridge in understanding.",
      });
    }
  },
});
