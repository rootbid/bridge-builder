import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifySession } from "./auth";

const TYPING_TIMEOUT_MS = 3000;

export const setTyping = mutation({
    args: {
        coupleId: v.id("couples"),
        sessionToken: v.string(),
        isTyping: v.boolean(),
    },
    handler: async (ctx, args) => {
        const partnerId = await verifySession(ctx, args.sessionToken);

        // HIGH-2: Verify the partner belongs to this couple
        const couple = await ctx.db.get(args.coupleId);
        if (!couple || (couple.partnerA !== partnerId && couple.partnerB !== partnerId)) {
            throw new Error("Unauthorized: Partner does not belong to this bridge");
        }

        const existing = await ctx.db
            .query("presence")
            .withIndex("by_partner", (q) => q.eq("partnerId", partnerId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                isTyping: args.isTyping,
                lastSeen: Date.now(),
            });
        } else {
            await ctx.db.insert("presence", {
                coupleId: args.coupleId,
                partnerId: partnerId,
                isTyping: args.isTyping,
                lastSeen: Date.now(),
            });
        }
    },
});

export const getPartnerPresence = query({
    args: {
        coupleId: v.id("couples"),
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        let myPartnerId: string;
        try {
            myPartnerId = await verifySession(ctx, args.sessionToken);
        } catch {
            return { isTyping: false, isOnline: false };
        }

        const presences = await ctx.db
            .query("presence")
            .withIndex("by_couple", (q) => q.eq("coupleId", args.coupleId))
            .collect();

        const partnerPresence = presences.find((p) => p.partnerId !== myPartnerId);

        if (!partnerPresence) return { isTyping: false, isOnline: false };

        const isRecent = Date.now() - partnerPresence.lastSeen < TYPING_TIMEOUT_MS;

        return {
            isTyping: partnerPresence.isTyping && isRecent,
            isOnline: Date.now() - partnerPresence.lastSeen < 30000,
        };
    },
});
