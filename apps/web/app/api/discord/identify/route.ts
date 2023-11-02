import type { NextApiRequest, NextApiResponse } from "next";
import KeycloaAdminCli from "@keycloak/keycloak-admin-client";
import Cookies from "cookies";
import { encode, getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (session.discord_uid) {
    res.status(400).json({ error: "Discord account already linked!" });
    return;
  }
  const [accessCode] = [req.query.code] as string[];

  if (!accessCode) {
    res.status(400).json({ error: "Missing access code" });
    return;
  }

  try {
    const token = await fetchDiscordAccessToken(accessCode);
    if (!token.access_token) {
      res.status(400).json({ error: "Invalid access code" });
      return;
    }
    const user = await fetchDiscordUser(token.access_token);
    if (!user) {
      res.status(400).json({ error: "Invalid access code" });
      return;
    }
    // Set cookies
    res.setHeader("Set-Cookie", [
      `discordId=${user.id}; Path=/;`,
      `discordToken=${token.access_token}; Path=/;`,
      `discordRefreshToken=${token.refresh_token}; Path=/;`,
      `discordExpiresIn=${token.expires_in}; Path=/;`,
      `username=${user.username}; Path=/;`,
    ]);
    // Set discord_uid in keycloak
    const kc = new KeycloaAdminCli({
      baseUrl: process.env.KEYCLOAK_URL!,
      realmName: process.env.KEYCLOAK_REALM!,
    });
    await kc.auth({
      grantType: "client_credentials",
      clientId: process.env.KEYCLOAK_REALM!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    });
    await kc.users.update(
      {
        id: session.user.id,
        realm: process.env.KEYCLOAK_REALM!,
      },
      {
        attributes: {
          discord_uid: [user.id],
          discord_refresh_token: [token.refresh_token],
          discord_username: [user.username],
        },
      }
    );
    try {
      // Send Discord message containing lovense qr code
      // !!!!!Security issue here, anyone can send a message to the user!!!!
      await fetch(
        `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/lovense/qr/discord/${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`, //nextauth kc token
          },
        }
      );
    } catch (e) {
      console.log(`Failed to send discord qr code: ${e}`);
    }

    res.status(200).json(user);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Something went wrong" });
  }
}

async function fetchDiscordAccessToken(accessCode: string) {
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code: accessCode,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      scope: "identify",
    }),
  });
  return res.json();
}

async function fetchDiscordUser(accessToken: string) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.json();
}
