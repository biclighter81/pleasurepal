import { unlinkDiscord } from "@/lib/functions/profile";
import { IconAlertTriangle } from "@tabler/icons-react";
import Button from "../app/interaction/Button";

export default function DiscordLink({ isLinked }: { isLinked: boolean }) {
  return (
    <>
      {isLinked ? (
        <Button
          onClick={unlinkDiscord}
          text="Unlink discord account"
          icon={<IconAlertTriangle />}
          theme="danger"
        />
      ) : (
        <Button
          text="Link discord account"
          theme="primary-gradient"
          href={process.env.NEXT_PUBLIC_DISCORD_IDENTIFICATION_URL!}
        />
      )}
    </>
  );
}
