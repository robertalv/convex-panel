import { Loops } from "@devwithbobby/loops";
import { components } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

const loops = new Loops(components.loops);

export const marketingSignup = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email) {
      throw new Error("Email is required");
    }

    const recipientCheck = await loops.checkRecipientRateLimit(ctx, {
      email,
      timeWindowMs: 60 * 60 * 1000, // 1 hour
      maxEmails: 5,
    });

    if (!recipientCheck.allowed) {
      throw new Error("Too many signup attempts for this email. Please try again later.");
    }

    // Global rate limit to avoid abuse across the whole signup endpoint.
    const globalCheck = await loops.checkGlobalRateLimit(ctx, {
      timeWindowMs: 60 * 1000, // 1 minute
      maxEmails: 200,
    });

    if (!globalCheck.allowed) {
      throw new Error("Signups are temporarily rate limited. Please try again shortly.");
    }

    const source = args.source ?? "convex-panel-marketing";

    await loops.addContact(ctx, {
      email,
      firstName: args.name,
      source,
      subscribed: true,
      userGroup: "marketing-signup",
    });

    return { success: true };
  },
});


