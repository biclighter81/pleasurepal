import NextAuth, {
  Account,
  Awaitable,
  NextAuthOptions,
  Profile,
  Session,
  User,
} from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import KeycloakProvider, {
  KeycloakProfile,
} from "next-auth/providers/keycloak";
export const authOptions: NextAuthOptions = {
  events: {},
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET!,
  callbacks: {
    session(params: {
      session: Session;
      user: User | AdapterUser;
      token: any;
    }): Awaitable<Session> {
      if (params.session.user && params.token.sub) {
        params.session.user.id = params.token.sub;
      }
      return {
        ...params.session,
        ...params.token,
      };
    },
    jwt(params: {
      token: any;
      user?: User | AdapterUser | undefined;
      account?: Account | null | undefined;
      profile?: Profile | undefined;
      isNewUser?: boolean | undefined;
    }): Awaitable<any> {
      if (params.account && params.user) {
        return {
          ...params.token,
          ...params.account,
          ...params.profile,
          ...params.user,
        };
      }
      if (params.token.expires_at > Date.now()) {
        return params.token;
      }
      return refreshToken(params.token);
    },
  },
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      idToken: true,
      wellKnown: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`,
      profile(profile: KeycloakProfile) {
        return {
          id: profile.sub,
          name: profile.preferred_username,
          email: profile.email,
          image: profile.picture,
        };
      },
      authorization: {
        params: {
          scope: "openid profile email discord",
        },
      },
    }),
  ],
};

async function refreshToken(token: any) {
  try {
    const res = await fetch(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
          refresh_token: token.refresh_token,
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      throw data;
    }
    return {
      ...token,
      ...data,
      expires_at: Date.now() + data.expires_in * 1000,
    };
  } catch (error) {
    console.log(error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }