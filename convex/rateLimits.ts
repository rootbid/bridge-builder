import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const DAILY_BRIDGE_LIMIT = 20;

/** Get today's date string in UTC */
function todayUTC(): string {
    return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

/** Check if a device can still build bridges today */
export const checkLimit = query({
    args: { fingerprint: v.string() },
    handler: async (ctx, args) => {
        if (!args.fingerprint || args.fingerprint.length > 30) {
            return { allowed: false, remaining: 0, limit: DAILY_BRIDGE_LIMIT };
        }

        const today = todayUTC();
        const record = await ctx.db
            .query("rateLimits")
            .withIndex("by_fingerprint_date", (q) =>
                q.eq("fingerprint", args.fingerprint).eq("date", today)
            )
            .first();

        const count = record?.bridgeCount ?? 0;
        return {
            allowed: count < DAILY_BRIDGE_LIMIT,
            remaining: Math.max(0, DAILY_BRIDGE_LIMIT - count),
            limit: DAILY_BRIDGE_LIMIT,
        };
    },
});

/** Increment the bridge counter for a device. Returns false if limit reached. */
export const incrementUsage = mutation({
    args: { fingerprint: v.string() },
    handler: async (ctx, args) => {
        if (!args.fingerprint || args.fingerprint.length > 30) {
            throw new Error("Invalid device fingerprint");
        }

        const today = todayUTC();
        const record = await ctx.db
            .query("rateLimits")
            .withIndex("by_fingerprint_date", (q) =>
                q.eq("fingerprint", args.fingerprint).eq("date", today)
            )
            .first();

        const currentCount = record?.bridgeCount ?? 0;

        if (currentCount >= DAILY_BRIDGE_LIMIT) {
            throw new Error(
                `Daily limit reached (${DAILY_BRIDGE_LIMIT} bridges per day). Come back tomorrow!`
            );
        }

        if (record) {
            await ctx.db.patch(record._id, {
                bridgeCount: currentCount + 1,
                lastRequestAt: Date.now(),
            });
        } else {
            await ctx.db.insert("rateLimits", {
                fingerprint: args.fingerprint,
                date: today,
                bridgeCount: 1,
                lastRequestAt: Date.now(),
            });
        }

        return { remaining: DAILY_BRIDGE_LIMIT - (currentCount + 1) };
    },
});
