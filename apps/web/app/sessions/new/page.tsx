'use client'
import Button from "@/components/app/interaction/Button";
import DarkInput from "@/components/app/interaction/DarkInput";
import FriendSelector from "@/components/app/interaction/FriendSelector";
import { generateName } from "@/lib/name-generator";
import { Friend } from "@/lib/types/friend";
import { IconPlus } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewSession() {
  const { data } = useSession();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [session, setSession] = useState<any>({
    name: generateName(),
    users: [],
  });
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (data) {
      setSession({ ...session, users: [data.sub] });
    }
  }, [data]);

  async function handleCreate() {
    if (!validate()) return;
    const body = {
      ...session,
      uids: [...session.users, ...friends.map((f) => f.uid)],
    };
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data?.access_token}`,
          },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (res.ok) {
        router.push(`/sessions/${json.id}`);
      }
    } catch (e) {
      console.log(e);
    }
  }

  function validate() {
    const errors: any = {};
    if (!session.name) {
      errors.name = "Name is required";
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  }

  return (
    <>
      <div className="px-8 py-8">
        <div>
          <h1 className="text-4xl uppercase font-bold">New session</h1>
          <span className="text-sm">Create session and invite friends</span>
        </div>
        <div className="mt-4 flex flex-col space-y-4">
          <DarkInput
            value={session.name}
            label="Session name"
            placeholder="Session name"
            onChange={(e) => {
              setSession({ ...session, name: e.target.value });
            }}
          />
          <FriendSelector
            label="Select Friends"
            selected={friends}
            setSelected={setFriends}
          />
          <div className="w-fit">
            <Button
              theme="primary-gradient"
              text="Create session"
              onClick={handleCreate}
              icon={<IconPlus className="h-5 w-5" />}
            />
          </div>
        </div>
      </div>
    </>
  );
}
