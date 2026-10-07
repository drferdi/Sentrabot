import type { EmailSender } from "@sentrabot/adapter-kit";
import { emailAllowed } from "@sentrabot/core";
import { bootstrapUserWorkspace, type PrismaClient, resolveSignupPolicy } from "@sentrabot/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { bearer, organization } from "better-auth/plugins";
import { deliverAuthEmail, passwordResetEmail, verificationEmail } from "./auth-emails.js";

export interface AuthEnv {
  secret: string;
  baseURL: string;
  webOrigin: string;
  signupsEnabled: string | undefined;
  signupAllowlist: string | undefined;
  extraOrigins?: string[];
  beforeDeleteUser?: (userId: string) => Promise<void>;
  /**
   * Defaults to enabled. Better-auth only turns its own rate limiter on when
   * it detects `NODE_ENV=production`; this repo already pins NODE_ENV so a
   * developer .env can't demote the stack (see 13fba6e), so leave this
   * pinned on too rather than trusting that detection a second time. Only
   * tests should ever pass `false`.
   */
  rateLimitEnabled?: boolean;
  /**
   * Transactional auth email. Absent on a deployment that configured no SMTP_URL, so every
   * flow that needs it must degrade instead of throwing: the API still has to boot.
   */
  emailSender?: EmailSender;
  /**
   * Called when an auth email could not be sent, so a deployment can see the gap in its logs
   * rather than wondering why nobody receives anything.
   */
  onEmailUnavailable?: (reason: string) => void;
}

export { resolveSignupPolicy } from "@sentrabot/db";

export function createAuth(prisma: PrismaClient, env: AuthEnv) {
  return betterAuth({
    appName: "Sentra Bot",
    secret: env.secret,
    baseURL: env.baseURL,
    trustedOrigins: [env.webOrigin, env.baseURL, ...(env.extraOrigins ?? [])],
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    // Window/max/customRules use better-auth's defaults (including the
    // stricter built-in sign-in/sign-up rules); only `enabled` is pinned so
    // protection doesn't silently depend on better-auth's own `isProduction`
    // detection. `storage: "memory"` (the default) is correct for a
    // single-instance self-host; a multi-instance deployment would need
    // `secondaryStorage` so counters are shared across processes.
    rateLimit: { enabled: env.rateLimitEnabled ?? true },
    emailVerification: {
      sendOnSignUp: true,
      // Deliberately NOT paired with `requireEmailVerification`: blocking sign-in before the
      // first click would cost more activation than an unverified account costs us. Risky
      // actions gate on `emailVerified` individually instead.
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await deliverAuthEmail(env.emailSender, user.email, verificationEmail(url), (reason) =>
          env.onEmailUnavailable?.(reason),
        );
      },
    },
    emailAndPassword: {
      enabled: true,
      // Every session dies with the old password: a reset is the recovery path for an account
      // the user may have lost control of, so leaving other devices signed in would defeat it.
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await deliverAuthEmail(env.emailSender, user.email, passwordResetEmail(url), (reason) =>
          env.onEmailUnavailable?.(reason),
        );
      },
      // Signup policy is mutable deployment state, so the request hook below
      // enforces it instead of freezing an environment value at process start.
      disableSignUp: false,
    },
    user: {
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          await env.beforeDeleteUser?.(user.id);
          const memberships = await prisma.member.findMany({
            where: { userId: user.id },
            select: {
              organizationId: true,
              organization: { select: { members: { select: { userId: true } } } },
            },
          });
          const personalOrganizationIds = memberships
            .filter(({ organization }) =>
              organization.members.every((member) => member.userId === user.id),
            )
            .map(({ organizationId }) => organizationId);

          await prisma.$transaction([
            prisma.deploymentSettings.updateMany({
              where: { ownerUserId: user.id },
              data: { ownerUserId: null },
            }),
            // Phone identities are deliberately FK-free, so clear them here
            // or the unique phoneE164 would point at a deleted bot forever.
            prisma.phoneIdentity.deleteMany({
              where: { userId: user.id },
            }),
            prisma.organization.deleteMany({
              where: { id: { in: personalOrganizationIds } },
            }),
          ]);
        },
      },
    },
    plugins: [
      bearer(),
      organization({
        allowUserToCreateOrganization: false,
        creatorRole: "owner",
        // Deliberately redundant with blockedAuthPaths: that is path matching, this is the plugin refusing the operation.
        disableOrganizationDeletion: true,
      }),
    ],
    hooks: {
      before: async (ctx) => {
        const path = String((ctx as { path?: string }).path ?? "");
        if (!path.includes("sign-up")) return;
        const policy = await resolveSignupPolicy(prisma, env);
        if (!policy.enabled) {
          throw new APIError("BAD_REQUEST", { message: "Pendaftaran ditutup" });
        }
        const email =
          typeof ctx.body === "object" && ctx.body && "email" in ctx.body
            ? String((ctx.body as { email?: string }).email ?? "")
            : "";
        if (email && !emailAllowed(email, policy.allowlist)) {
          throw new APIError("BAD_REQUEST", { message: "Email ini tidak diizinkan mendaftar" });
        }
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await bootstrapUserWorkspace(prisma, user, env);
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

export const blockedAuthPaths = [
  "/organization/create",
  "/organization/invite",
  "/organization/accept-invitation",
  "/organization/reject-invitation",
  "/organization/remove-member",
  "/organization/update-member-role",
  "/organization/delete",
  "/organization/leave",
  "/organization/update",
];
