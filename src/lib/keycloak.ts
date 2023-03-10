import axios from 'axios';
import { KeycloakUser } from './interfaces/keycloak';

export async function getKCUserByDiscordId(
  discordId: string,
): Promise<KeycloakUser | undefined> {
  try {
    const token = await getKCToken();
    const res = await axios.get<KeycloakUser[]>(
      `${process.env.KEYCLOAK_URL}/admin/realms/pleasurepal/users?q=discord_uid:${discordId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.data || !res.data.length) {
      return undefined;
    }
    return res.data[0];
  } catch (err) {
    console.error(err.response.data);
    throw err;
  }
}

export async function getDiscordUidByKCId(
  kcId: string,
): Promise<string | undefined> {
  try {
    const token = await getKCToken();
    const res = await axios.get<KeycloakUser>(
      `${process.env.KEYCLOAK_URL}/admin/realms/pleasurepal/users/${kcId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.data || !res.data.attributes) {
      return undefined;
    }
    return res.data.attributes.discord_uid[0];
  } catch (err) {
    console.error(err.response.data);
    throw err;
  }
}

export async function getKCToken(): Promise<string> {
  try {
    const res = await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/pleasurepal/protocol/openid-connect/token`,
      {
        grant_type: 'client_credentials',
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const data = res.data;
    return data.access_token;
  } catch (err) {
    console.error(err.response.data);
    throw err;
  }
}
