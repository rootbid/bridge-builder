import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  couples: defineTable({
    partnerA: v.string(),
    partnerB: v.optional(v.string()),
    inviteCode: v.string(),
    isActive: v.boolean(),
    inviteExpiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_partners", ["partnerA", "partnerB"])
    .index("by_invite", ["inviteCode"]),

  rounds: defineTable({
    coupleId: v.id("couples"),
    roundNumber: v.number(),
    questionId: v.string(),
    questionText: v.string(),
    questionCategory: v.optional(v.string()),
    partnerAAnswer: v.optional(v.string()),
    partnerBAnswer: v.optional(v.string()),
    partnerASubmitted: v.boolean(),
    partnerBSubmitted: v.boolean(),
    partnerATaskCompleted: v.optional(v.boolean()),
    partnerBTaskCompleted: v.optional(v.boolean()),
    partnerAFeedback: v.optional(v.union(v.literal("positive"), v.literal("negative"))),
    partnerBFeedback: v.optional(v.union(v.literal("positive"), v.literal("negative"))),
    status: v.union(
      v.literal("waiting"),
      v.literal("answering"),
      v.literal("all_submitted"),
      v.literal("revealing"),
      v.literal("bridging"),
      v.literal("completed")
    ),
    bridgeTask: v.optional(
      v.object({
        taskA: v.string(),
        taskB: v.string(),
        insight: v.string(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_couple", ["coupleId"])
    .index("by_couple_status", ["coupleId", "status"]),

  presence: defineTable({
    coupleId: v.id("couples"),
    partnerId: v.string(),
    isTyping: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_couple", ["coupleId"])
    .index("by_partner", ["partnerId"]),

  rateLimits: defineTable({
    fingerprint: v.string(),
    date: v.string(), // "YYYY-MM-DD"
    bridgeCount: v.number(),
    lastRequestAt: v.number(),
  })
    .index("by_fingerprint_date", ["fingerprint", "date"]),

  sessions: defineTable({
    token: v.string(),
    partnerId: v.string(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"]),
});
