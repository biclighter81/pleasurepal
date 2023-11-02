import Button from "@/components/app/interaction/Button";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DiscordLink from "../../components/profile/DiscordLink";

export default function Profile() {
  const [duration, setDuration] = useState<string>("0");
  const [intensity, setIntensity] = useState<string>("0");
  const reloadSession = () => {
    const event = new Event("visibilitychange");
    document.dispatchEvent(event);
  };
  const identified = useSearchParams().get("identified");

  useEffect(() => {
    if (identified) {
      router.replace("/profile");
      reloadSession();
    }
  }, [identified]);

  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  if (!session && sessionStatus === "unauthenticated") {
    router.push("/");
  }
  if (sessionStatus === "loading") return <p>Loading...</p>;

  return (
    <div className="px-8 py-8">
      <div>
        <h1 className="text-4xl uppercase font-bold">Profile</h1>
        <span className="text-sm">How are you doing {session?.name}?</span>
        <DiscordLink isLinked={session?.discord_uid ? true : false} />
        <div className="mt-4 flex flex-col space-y-4 w-fit">
          <div>
            <span className="uppercase font-bold text-xs ">Duration</span>
            <div className="bg-dark px-4 py-2 rounded-lg flex items-center space-x-4">
              <input
                className="bg-transparent w-full ring-0 outline-none text-sm font-light text-gray-400"
                placeholder="Duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div>
            <span className="uppercase font-bold text-xs ">Intensity</span>
            <div className="bg-dark px-4 py-2 rounded-lg flex items-center space-x-4">
              <input
                className="bg-transparent w-full ring-0 outline-none text-sm font-light text-gray-400"
                placeholder="Intensity"
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
              />
            </div>
            {session?.access_token}
          </div>

          <Button
            onClick={async () => {
              const res = await fetch(
                process.env.NEXT_PUBLIC_PLEASUREPAL_API +
                  "/api/device/self-command",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + session?.access_token,
                  },
                  body: JSON.stringify({
                    duration: parseInt(duration),
                    intensity: parseFloat(intensity),
                  }),
                }
              );
              const data = await res.json();
              console.log(data);
            }}
            text="Self Command"
            theme="primary-gradient"
          />
        </div>
        <div className="mt-4">
          <Button
            text="Start Random Session"
            theme="primary-gradient"
            onClick={async () => {
              const res = await fetch(
                process.env.NEXT_PUBLIC_PLEASUREPAL_API +
                  "/api/device/self-random",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + session?.access_token,
                  },
                }
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
