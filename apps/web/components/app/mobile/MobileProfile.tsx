import { identicon } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { IconLogout } from "@tabler/icons-react";
import { signOut, useSession } from "next-auth/react";
import { useAppStore } from "../../../stores/app.store";
import FriendRequests from "../notifications/FriendRequest";
import Inbox from "../notifications/Inbox";

export default function MobileProfile() {
  const { data: session } = useSession();
  const avatar = createAvatar(identicon, {
    seed: session?.user.email,
    size: 28,
  });

  return (
    <>
      <div className="flex items-center">
        <div
          className="relative h-16 w-16 bg-dark flex items-center justify-center rounded-full hover:scale-105 ease-in-out duration-200 transform hover:cursor-pointer"
          onClick={(e) => {
            useAppStore.getState().setMenu(false);
            if (useAppStore.getState().profileSidebar) {
              useAppStore.getState().setProfileSidebar(false);
            } else {
              useAppStore.getState().setProfileSidebar(true);
            }
          }}
        >
          <img
            className="rounded-full"
            src={`${avatar.toDataUriSync()}`}
            id="profile-avatar"
          />
        </div>
        <div className="flex flex-col ml-6 justify-center">
          <h3 className="uppercase font-bold">{session?.user.name}</h3>
          <div
            className="flex mt-2"
            onClick={() => {
              signOut();
            }}
          >
            <IconLogout className="h-5 w-5 mr-2" />
            <span className="font-bold text-sm uppercase">Logout</span>
          </div>
        </div>
        <div className="flex-grow flex justify-end space-x-8">
          <div>
            <FriendRequests isMobile />
          </div>
          <div>
            <Inbox isMobile />
          </div>
        </div>
      </div>
    </>
  );
}
