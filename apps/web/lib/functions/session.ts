import { getSession } from "next-auth/react";

async function fetchInvites() {
  const session = await getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/session/invites`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session?.access_token,
      },
    }
  );
  const data = await res.json();
  return data;
}

async function acceptInvite(sessionId: string) {
  const session = await getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/session/invite/accept/${sessionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session?.access_token,
      },
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data);
  }
  return data;
}

async function declineInvite(sessionId: string) {
  const session = await getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/session/invite/decline/${sessionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session?.access_token,
      },
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data);
  }
  return data;
}

async function fetchSessions(offset?: number, q?: string) {
  const session = await getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/session?offset=${offset}&q=${q}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session?.access_token,
      },
    }
  );
  const data = await res.json();
  return data;
}

export { fetchInvites, acceptInvite, declineInvite, fetchSessions };
