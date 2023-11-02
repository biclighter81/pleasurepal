import { identicon } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { Transition } from "@headlessui/react";
import {
  IconHeartHandshake,
  IconLogout,
  IconMessages,
  IconTopologyRing3,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useAppStore } from "../../stores/app.store";

export default function ProfileSidebar() {
  const appStore = useAppStore();
  const ref = useRef();
  const router = useRouter();
  const { data: session } = useSession();
  const avatar = createAvatar(identicon, {
    seed: session?.user.email,
    size: 28,
  });

  const handleClickOutside = (event: any) => {
    if (
      ref.current &&
      !(ref.current as any).contains(event.target) &&
      event.target.id !== "profile-avatar"
    ) {
      const prev = useAppStore.getState().profileSidebar;
      if (prev) {
        appStore.setProfileSidebar(false);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  return (
    <>
      <div ref={ref as any}>
        <Transition
          show={appStore.profileSidebar}
          enter="transition ease-out duration-300 transform"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
          className="relative z-10"
        >
          <div className="bg-dark w-[350px] sm:w-[400px] h-[calc(100vh-80px)] absolute right-0 shadow-2xl px-6 sm:px-10 py-4 sm:py-6 flex flex-col space-y-4 z-20">
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-6 w-full">
                <div
                  className="relative h-12 w-12 bg-light-dark flex items-center justify-center rounded-full hover:scale-105 ease-in-out duration-200 transform hover:cursor-pointer"
                  onClick={() => {
                    useAppStore.getState().setProfileSidebar(false);
                    router.push("/profile");
                  }}
                >
                  <img
                    className="rounded-full"
                    src={`${avatar.toDataUriSync()}`}
                    id="profile-avatar"
                  />
                </div>
                <div className="flex items-center">
                  <h4 className="uppercase font-semibold text-sm">
                    {session?.user.name}
                  </h4>
                </div>
                <div className="flex-grow flex items-center justify-end">
                  <IconX
                    className="h-7 w-7 text-white hover:cursor-pointer hover:scale-105 ease-in-out duration-200"
                    onClick={() => appStore.setProfileSidebar(false)}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-full rounded-xl h-[2px] bg-white" />
              </div>
              <div
                className="flex items-center hover:scale-105 ease-in-out duration-200 hover:cursor-pointer space-x-8"
                onClick={() => {
                  useAppStore.getState().setProfileSidebar(false);
                  router.push("/profile");
                }}
              >
                <IconUser className="text-white h-6 w-6" />
                <h6 className="uppercase text font-semibold">Profile</h6>
              </div>
              <div className="flex items-center hover:scale-105 ease-in-out duration-200 hover:cursor-pointer space-x-8">
                <IconMessages className="text-white h-6 w-6" />
                <h6 className="uppercase text font-semibold">Chat</h6>
              </div>
              <div
                className="flex items-center hover:scale-105 ease-in-out duration-200 hover:cursor-pointer space-x-8"
                onClick={() => {
                  router.push("/sessions");
                  useAppStore.getState().setProfileSidebar(false);
                }}
              >
                <IconTopologyRing3 className="text-white h-6 w-6" />
                <h6 className="uppercase font-semibold">Session</h6>
              </div>
              <div
                className="flex items-center hover:scale-105 ease-in-out duration-200 hover:cursor-pointer space-x-8"
                onClick={() => {
                  router.push("/profile/friends");
                  useAppStore.getState().setProfileSidebar(false);
                }}
              >
                <IconHeartHandshake className="text-white h-6 w-6" />
                <h6 className="uppercase  font-semibold">Friends</h6>
              </div>
            </div>
            <div className="flex-grow flex items-end">
              <div className="flex items-center hover:scale-105 ease-in-out duration-200 hover:cursor-pointer space-x-8 mb-4">
                <IconLogout className="text-white h-6 w-6" />
                <h6 className="uppercase  font-semibold">Logout</h6>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </>
  );
}
