import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { verifySession } from "./auth";

// --- Constants (MED-1: Input length limits) ---
const MAX_ANSWER_LENGTH = 5000;
const MAX_QUESTION_LENGTH = 1000;
const MAX_QUESTION_ID_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 100;

// --- Helpers ---

/** CRIT-2 / HIGH-2: Verify the caller's session token belongs to this couple */
async function verifyPartnerOwnership(
  ctx: any,
  coupleId: any,
  sessionToken: string
): Promise<{ partnerId: string; partnerRole: "A" | "B" }> {
  const partnerId = await verifySession(ctx, sessionToken);
  const couple = await ctx.db.get(coupleId);
  if (!couple) throw new Error("Couple not found");

  if (couple.partnerA === partnerId) {
    return { partnerId, partnerRole: "A" };
  } else if (couple.partnerB === partnerId) {
    return { partnerId, partnerRole: "B" };
  } else {
    throw new Error("Unauthorized: You are not a member of this bridge");
  }
}

// --- Queries ---

export const getLatestRound = query({
  args: { coupleId: v.id("couples"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifyPartnerOwnership(ctx, args.coupleId, args.sessionToken);
    return await ctx.db
      .query("rounds")
      .withIndex("by_couple", (q) => q.eq("coupleId", args.coupleId))
      .order("desc")
      .first();
  },
});

export const getHistory = query({
  args: { coupleId: v.id("couples"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifyPartnerOwnership(ctx, args.coupleId, args.sessionToken);
    return await ctx.db
      .query("rounds")
      .withIndex("by_couple", (q) => q.eq("coupleId", args.coupleId))
      .order("desc")
      .collect();
  },
});

export const getRoundCount = query({
  args: { coupleId: v.id("couples"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifyPartnerOwnership(ctx, args.coupleId, args.sessionToken);
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_couple", (q) => q.eq("coupleId", args.coupleId))
      .collect();
    return rounds.length;
  },
});

export const getUsedQuestionIds = query({
  args: { coupleId: v.id("couples"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifyPartnerOwnership(ctx, args.coupleId, args.sessionToken);
    const recentRounds = await ctx.db
      .query("rounds")
      .withIndex("by_couple", (q) => q.eq("coupleId", args.coupleId))
      .order("desc")
      .take(10);
    return recentRounds.map((r) => r.questionId);
  },
});

// --- Mutations ---

export const startRound = mutation({
  args: {
    coupleId: v.id("couples"),
    questionId: v.string(),
    questionText: v.string(),
    questionCategory: v.optional(v.string()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyPartnerOwnership(ctx, args.coupleId, args.sessionToken);

    // MED-1: Input length validation
    if (args.questionId.length > MAX_QUESTION_ID_LENGTH) throw new Error("Question ID too long");
    if (args.questionText.length > MAX_QUESTION_LENGTH) throw new Error("Question too long");
    if (args.questionCategory && args.questionCategory.length > MAX_CATEGORY_LENGTH) throw new Error("Category too long");

    const existingRounds = await ctx.db
      .query("rounds")
      .withIndex("by_couple", (q) => q.eq("coupleId", args.coupleId))
      .collect();

    const roundNumber = existingRounds.length + 1;

    const roundId = await ctx.db.insert("rounds", {
      coupleId: args.coupleId,
      roundNumber,
      questionId: args.questionId,
      questionText: args.questionText,
      questionCategory: args.questionCategory,
      partnerASubmitted: false,
      partnerBSubmitted: false,
      partnerATaskCompleted: false,
      partnerBTaskCompleted: false,
      status: "answering",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return roundId;
  },
});

export const submitAnswer = mutation({
  args: {
    roundId: v.id("rounds"),
    answer: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");

    // Securely resolve which partner is submitting, eliminating spoofing
    const { partnerRole } = await verifyPartnerOwnership(ctx, round.coupleId, args.sessionToken);

    // MED-1: Input length validation
    if (args.answer.length > MAX_ANSWER_LENGTH) {
      throw new Error("Answer too long (max 5000 characters)");
    }
    if (args.answer.length === 0) {
      throw new Error("Answer cannot be empty");
    }

    // CRIT-2: Prevent answering on completed/wrong-state rounds
    if (round.status !== "answering") {
      throw new Error("Round is not accepting answers");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (partnerRole === "A") {
      if (round.partnerASubmitted) throw new Error("Partner A has already answered");
      updates.partnerAAnswer = args.answer;
      updates.partnerASubmitted = true;
    } else {
      if (round.partnerBSubmitted) throw new Error("Partner B has already answered");
      updates.partnerBAnswer = args.answer;
      updates.partnerBSubmitted = true;
    }

    await ctx.db.patch(args.roundId, updates);

    const updatedRound = await ctx.db.get(args.roundId);
    if (updatedRound?.partnerASubmitted && updatedRound?.partnerBSubmitted) {
      await ctx.db.patch(args.roundId, { status: "all_submitted" });
    }
  },
});

export const revealAnswers = mutation({
  args: { roundId: v.id("rounds"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");

    await verifyPartnerOwnership(ctx, round.coupleId, args.sessionToken);

    if (round.status !== "all_submitted") throw new Error("Cannot reveal — both partners must answer first");

    await ctx.db.patch(args.roundId, {
      status: "revealing",
      updatedAt: Date.now(),
    });
  },
});

// Used by AI action, no sessionToken required since it's internal
export const setBridgeTask = internalMutation({
  args: {
    roundId: v.id("rounds"),
    taskA: v.string(),
    taskB: v.string(),
    insight: v.string(),
  },
  handler: async (ctx, args) => {
    // MED-1: Validate AI output lengths
    if (args.taskA.length > 2000 || args.taskB.length > 2000 || args.insight.length > 2000) {
      throw new Error("Bridge task content too long");
    }

    await ctx.db.patch(args.roundId, {
      status: "bridging",
      bridgeTask: {
        taskA: args.taskA,
        taskB: args.taskB,
        insight: args.insight,
      },
      updatedAt: Date.now(),
    });
  },
});

export const completeRound = mutation({
  args: { roundId: v.id("rounds"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");

    await verifyPartnerOwnership(ctx, round.coupleId, args.sessionToken);

    if (round.status !== "bridging") throw new Error("Cannot complete — bridge tasks are not active");

    await ctx.db.patch(args.roundId, {
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});

export const completeBridgeTask = mutation({
  args: { roundId: v.id("rounds"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");

    // Securely resolve which partner is submitting, eliminating spoofing
    const { partnerRole } = await verifyPartnerOwnership(ctx, round.coupleId, args.sessionToken);

    if (round.status !== "bridging" && round.status !== "completed") {
      throw new Error("Round is not in bridging state");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (partnerRole === "A") {
      updates.partnerATaskCompleted = true;
    } else {
      updates.partnerBTaskCompleted = true;
    }

    await ctx.db.patch(args.roundId, updates);

    // If both are completed
    const updatedRound = await ctx.db.get(args.roundId);
    if (updatedRound?.partnerATaskCompleted && updatedRound?.partnerBTaskCompleted) {
      await ctx.db.patch(args.roundId, {
        status: "completed",
      });
    }
  },
});

export const submitBridgeFeedback = mutation({
  args: {
    roundId: v.id("rounds"),
    sessionToken: v.string(),
    feedback: v.union(v.literal("positive"), v.literal("negative"))
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");

    const { partnerRole } = await verifyPartnerOwnership(ctx, round.coupleId, args.sessionToken);

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (partnerRole === "A") {
      updates.partnerAFeedback = args.feedback;
    } else {
      updates.partnerBFeedback = args.feedback;
    }

    await ctx.db.patch(args.roundId, updates);
  },
});

export const resetRound = mutation({
  args: { roundId: v.id("rounds"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (round && round.status !== "completed") {
      await verifyPartnerOwnership(ctx, round.coupleId, args.sessionToken);
      await ctx.db.patch(args.roundId, {
        status: "completed",
        updatedAt: Date.now(),
      });
    }
  },
});

export const reCrossRound = mutation({
  args: {
    coupleId: v.id("couples"),
    originalRoundId: v.id("rounds"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyPartnerOwnership(ctx, args.coupleId, args.sessionToken);

    const original = await ctx.db.get(args.originalRoundId);
    if (!original) throw new Error("Original round not found");
    if (!original.bridgeTask) throw new Error("No bridge task to re-cross");

    // CRIT-2: Verify the round belongs to this couple
    if (original.coupleId !== args.coupleId) {
      throw new Error("Unauthorized: This round does not belong to your bridge");
    }

    const existingRounds = await ctx.db
      .query("rounds")
      .withIndex("by_couple", (q) => q.eq("coupleId", args.coupleId))
      .collect();

    const roundNumber = existingRounds.length + 1;

    const roundId = await ctx.db.insert("rounds", {
      coupleId: args.coupleId,
      roundNumber,
      questionId: original.questionId,
      questionText: original.questionText,
      questionCategory: original.questionCategory,
      partnerAAnswer: original.partnerAAnswer,
      partnerBAnswer: original.partnerBAnswer,
      partnerASubmitted: true,
      partnerBSubmitted: true,
      status: "bridging",
      bridgeTask: original.bridgeTask,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return roundId;
  },
});
