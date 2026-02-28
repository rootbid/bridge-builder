import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Generate a 256-bit secure random token in hex format */
function generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/** Generate a readable but unique partner ID */
function generatePartnerId(): string {
    return "p_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/** Create a new secure session and return the opaque token to the client */
export const createSession = mutation({
    args: {},
    handler: async (ctx) => {
        const token = generateSecureToken();
        const partnerId = generatePartnerId();

        await ctx.db.insert("sessions", {
            token,
            partnerId,
            createdAt: Date.now(),
        });

        return { token };
    },
});

/** Verify a session token and return the underlying partnerId. Throws if invalid. */
export async function verifySession(ctx: any, token: string | undefined): Promise<string> {
    if (!token || token.length !== 64) {
        throw new Error("Invalid or missing session token");
    }

    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q: any) => q.eq("token", token))
        .first();

    if (!session) {
        throw new Error("Invalid or expired session token");
    }

    return session.partnerId;
}
