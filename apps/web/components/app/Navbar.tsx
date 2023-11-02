'use client'
import { useAppStore } from "@/stores/app.store";
import { Transition } from "@headlessui/react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NavbarItem } from "../../lib/types/app";
import MobileProfile from "./mobile/MobileProfile";
import { useFriendStore } from "@/stores/friend.store";
import { useChatStore } from "@/stores/chat.store";
import Link from "next/link";

export default function Navbar() {
  const appStore = useAppStore();
  const { data: session } = useSession();
  const [animatePulse, setAnimatePulse] = useState<boolean>(false);
  const items: NavbarItem[] = [
    {
      name: "Home",
      href: "/",
      active: true,
    },
    {
      name: "Matchmaking",
      href: "/matchmaking",
      active: false,
    },
  ];
  const router = useRouter();
  const pathname = usePathname()

  const genericHamburgerLine = `h-[3px] w-8 my-1 rounded-full bg-zinc-200 transition ease transform duration-300`;

  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      if (state.socket?.connected) {
        const events = ["friendship-request", "message"];
        for (const event of events) {
          state.socket.on(event, () => {
            setAnimatePulse(true);
            setTimeout(() => {
              setAnimatePulse(false);
            }, 6000);
          });
        }
      }
    });
    return () => {
      unsub();
    };
  }, []);

  return (
    <>
      <div className="items-center space-x-8 hidden lg:flex">
        {items.map((item) => (
          <div key={item.href}>
            <Link href={item.href}>
              <span
                className={`uppercase font-bold text-sm ${item.href == pathname ? "text-primary-500" : null
                  } hover:text-primary-500 transition duration-300 ease-in-out cursor-pointer`}
              >
                {item.name}
              </span>
            </Link>
          </div>
        ))}
      </div>
      {/* Mobile */}
      <div className="lg:hidden flex justify-end">
        <div className="relative">
          <button
            className="flex flex-col h-fit w-fit rounded justify-center items-center group"
            onClick={() => appStore.setMenu(!appStore.menu)}
          >
            <div
              className={`${genericHamburgerLine} ${appStore.menu
                ? "rotate-45 translate-y-[11px]  group-hover:opacity-100"
                : " group-hover:opacity-100"
                }`}
            />
            <div
              className={`${genericHamburgerLine} ${appStore.menu ? "opacity-0" : "group-hover:opacity-100"
                }`}
            />
            <div
              className={`${genericHamburgerLine} ${appStore.menu
                ? "-rotate-45 -translate-y-[11px]  group-hover:opacity-100"
                : " group-hover:opacity-100"
                }`}
            />
          </button>
          {/* Notification */}
          {!appStore.menu && (
            <div
              className={`absolute rounded-full bg-primary-500 h-5 w-5 -top-1 -right-3 flex items-center justify-center`}
              style={{
                animation: animatePulse
                  ? "pulse-shadow 2s infinite cubic-bezier(0.4, 0, 0.6, 1)"
                  : "",
              }}
            >
              <span className="text-xs">
                {useFriendStore.getState().friendRequests.length +
                  useChatStore.getState().messages.length}
              </span>
            </div>
          )}
        </div>
      </div>
      <div
        className={`fixed top-20 left-0  w-full overflow-y-hidden  ${appStore.menu ? "z-10 h-full bottom-0" : "-z-10"
          }`}
      >
        <Transition
          show={appStore.menu}
          enter="transition ease-out duration-700 transform"
          enterFrom="opacity-75 translate-y-[-100%]"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-300 transform"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-75 translate-y-[-100%]"
          className={`w-full h-full relative z-20`}
        >
          <div className="w-full h-full bg-light-dark flex flex-col space-y-8 px-8 py-8">
            {!appStore.mobileMenuComponent &&
              items.map((item) => (
                <Link
                  href={item.href}
                  onClick={() => appStore.setMenu(false)}
                  key={item.href}
                >
                  <div>
                    <h4
                      className={`text-2xl font-semibold ${item.href == pathname && "text-primary-500"
                        }`}
                    >
                      {item.name}
                    </h4>
                  </div>
                </Link>
              ))}
            {appStore.mobileMenuComponent ? appStore.mobileMenuComponent : null}
            <div className="flex-grow flex flex-col justify-end pb-20 space-y-4">
              {session ? (
                <MobileProfile />
              ) : (
                <div className="flex flex-col space-y-8">
                  <div>
                    <h4
                      className="text-2xl font-semibold"
                      onClick={() => {
                        signIn("keycloak");
                      }}
                    >
                      Sign In
                    </h4>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Transition>
      </div>
    </>
  );
}
