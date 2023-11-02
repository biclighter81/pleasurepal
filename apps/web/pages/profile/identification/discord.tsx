import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DiscordIdentification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [error, setError] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [redirected, setRedirected] = useState<boolean>(false);

  useEffect(() => {
    if (!session && sessionStatus === "unauthenticated") {
      router.push("/");
    }
    if (session && sessionStatus === "authenticated" && !redirected) {
      setRedirected(true);
      const code = searchParams.get("code");
      if (code) {
        router.replace("/profile/identification/discord");
        fetch(`/api/discord/identify?code=${code}`)
          .then(async (me: Response) => {
            if (!me.ok) {
              setError(await me.text());
              return;
            }
            const user = await me.json();
            setUser(user);
            setTimeout(async () => {
              await signIn("keycloak", {
                callbackUrl: "/profile?identified=discord",
                redirect: false,
              });
            }, 3000);
          })
          .catch((err) => {
            setError(err.message);
          });
      }
    }
  }, [session]);

  if (sessionStatus === "loading") {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <>
        <h1>Fehler bei Identifizierung mit Discord</h1>
        <p>{error}</p>
      </>
    );
  }

  if (user) {
    return (
      <>
        <p>Successfully identified with Discord!</p>
        <p>Redirecting to profile in 5 seconds...</p>
        <p>Not redirecting?</p>
        <button
          onClick={async () => {
            await signIn("keycloak", {
              callbackUrl: "/profile?identified=discord",
              redirect: false,
            });
          }}
        >
          Profile
        </button>
        <p>{JSON.stringify(user)}</p>
      </>
    );
  }
}
