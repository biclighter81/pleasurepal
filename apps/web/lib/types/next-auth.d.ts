import NextAuth, { DefaultSession, JWT } from "next-auth";
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      name: string;
      email: string;
      id: string;
    } & DefaultSession["user"];
    expires: Date;
    name: string | null;
    email: string | null;
    sub: string | null;
    provider: string | null;
    type: string | null;
    providerAccountId: string | null;
    access_token: string | null;
    expires_at: number;
    refresh_expires_in: number;
    refresh_token: string | null;
    token_type: string | null;
    id_token: string | null;
    "not-before-policy": number;
    session_state: string | null;
    discord_uid: string | null;
    discord_refresh_token: string | null;
    discord_username: string | null;
    scope: string | null;
    exp: number;
    iat: number;
    auth_time: number;
    jti: string | null;
    iss: string | null;
    aud: string | null;
    typ: string | null;
    azp: string | null;
    at_hash: string | null;
    acr: string | null;
    sid: string | null;
    email_verified: boolean;
    foo: string | null;
    preferred_username: string | null;
    given_name: string | null;
    family_name: string | null;
    error?: string;
  }
}
