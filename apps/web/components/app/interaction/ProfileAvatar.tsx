import { createAvatar } from "@dicebear/core";
import { identicon } from "@dicebear/collection";
import { useSession } from "next-auth/react";
import { useAppStore } from "../../../stores/app.store";

export default function ProfileAvatar() {
  const { data: session } = useSession();
  const appStore = useAppStore();
  const avatar = createAvatar(identicon, {
    seed: session?.user.email,
    size: 25,
  });
  return (
    <>
      <div
        className="relative h-10 w-10 bg-light-dark flex items-center justify-center rounded-full hover:scale-105 ease-in-out duration-200 transform hover:cursor-pointer"
        id="profile-avatar"
        onClick={(e) => {
          if (appStore.profileSidebar) {
            appStore.setProfileSidebar(false);
          } else {
            appStore.setProfileSidebar(true);
          }
        }}
      >
        <img
          className="rounded-full"
          src={`${avatar.toDataUriSync()}`}
          id="profile-avatar"
        />
      </div>
    </>
  );
}
