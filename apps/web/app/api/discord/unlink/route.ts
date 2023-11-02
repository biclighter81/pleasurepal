import type { NextApiRequest, NextApiResponse } from "next";
import KeycloaAdminCli from "@keycloak/keycloak-admin-client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export default async function POST(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Unlink account
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
          discord_uid: [""],
          discord_refresh_token: [""],
          discord_username: [""],
        },
      }
    );
    res.status(200).json({ message: "Successfully unlinked discord account!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong" });
  }
}
