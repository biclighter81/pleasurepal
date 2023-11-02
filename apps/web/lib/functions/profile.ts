import { getSession, signIn } from 'next-auth/react';

async function unlinkDiscord(reloadSession?: () => void) {
  const res = await fetch('/api/discord/unlink', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  await res.json();
  if (res.status == 200) {
    await signIn('keycloak', {
      callbackUrl: '/profile?identified=discord',
      redirect: false,
    });
  }
  if (reloadSession) reloadSession();
}

async function searchUser(q: string) {
  if (!q) return [];
  try {
    const session = await getSession();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/user/search?q=` + q,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session?.access_token,
        },
      }
    );
    const data = await res.json();
    return data;
  } catch (e) {
    console.log(e);
  }
}

export { unlinkDiscord, searchUser };
