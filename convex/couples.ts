import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifySession } from "./auth";

// --- Constants ---
const INVITE_CODE_LENGTH = 8; // HIGH-3: Increased from 6 to 8 chars
const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 31 chars
const INVITE_CODE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_PARTNER_ID_LENGTH = 50; // MED-1: Input length limits
const MAX_INVITE_CODE_LENGTH = 10;

// --- Helpers ---
function generateInviteCode(): string {
    const randomBytes = new Uint8Array(INVITE_CODE_LENGTH);
    crypto.getRandomValues(randomBytes);
    let code = "";
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        code += INVITE_CODE_CHARS[randomBytes[i] % INVITE_CODE_CHARS.length];
    }
    return code;
}

// (Removed validatePartnerId since session tokens handle true identity securely)

// --- Mutations ---

export const createCouple = mutation({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const partnerId = await verifySession(ctx, args.sessionToken);

        const code = generateInviteCode();

        const coupleId = await ctx.db.insert("couples", {
            partnerA: partnerId,
            inviteCode: code,
            isActive: true,
            inviteExpiresAt: Date.now() + INVITE_CODE_EXPIRY_MS,
            createdAt: Date.now(),
        });

        return { coupleId, inviteCode: code };
    },
});

export const joinCouple = mutation({
    args: { inviteCode: v.string(), sessionToken: v.string() },
    handler: async (ctx, args) => {
        const partnerId = await verifySession(ctx, args.sessionToken);

        // MED-1: Validate invite code length
        if (args.inviteCode.length > MAX_INVITE_CODE_LENGTH) {
            throw new Error("Invalid invite code");
        }

        const couple = await ctx.db
            .query("couples")
            .withIndex("by_invite", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
            .first();

        if (!couple) throw new Error("Invalid invite code");
        if (couple.partnerB) throw new Error("This bridge already has two partners");
        if (couple.partnerA === partnerId) throw new Error("You can't join your own bridge");

        // HIGH-3: Check invite code expiration
        if (couple.inviteExpiresAt && Date.now() > couple.inviteExpiresAt) {
            throw new Error("This invite code has expired. Ask your partner to create a new bridge.");
        }

        await ctx.db.patch(couple._id, { partnerB: partnerId });
        return { coupleId: couple._id };
    },
});

// --- Queries ---

export const getCouple = query({
    args: { coupleId: v.id("couples"), sessionToken: v.string() },
    handler: async (ctx, args) => {
        // M3: Verify the caller is a member of this couple
        const partnerId = await verifySession(ctx, args.sessionToken);
        const couple = await ctx.db.get(args.coupleId);
        if (!couple) return null;
        if (couple.partnerA !== partnerId && couple.partnerB !== partnerId) {
            return null; // Silently return null instead of throwing to avoid enumeration
        }
        return couple;
    },
});

export const getCoupleByInvite = query({
    args: { inviteCode: v.string() },
    handler: async (ctx, args) => {
        if (args.inviteCode.length > MAX_INVITE_CODE_LENGTH) return null;

        const couple = await ctx.db
            .query("couples")
            .withIndex("by_invite", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
            .first();

        // HIGH-3: Don't return expired codes
        if (couple?.inviteExpiresAt && Date.now() > couple.inviteExpiresAt) {
            return null;
        }

        if (!couple) return null;

        // M4: Return only safe fields — don't expose partner IDs or internal data
        return {
            _id: couple._id,
            hasPartnerB: !!couple.partnerB,
            isActive: couple.isActive,
        };
    },
});
