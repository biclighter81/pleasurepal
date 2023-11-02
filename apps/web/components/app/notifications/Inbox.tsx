'use client'
import { acceptInvite, declineInvite } from "@/lib/functions/session";
import { useAppStore } from "@/stores/app.store";
import {
  IconCheck,
  IconHeartPlus,
  IconInbox,
  IconSettings,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import useClickOutside from "../../../lib/hooks/useClickOutside";
import InboxMenu from "../mobile/InboxMenu";
import { useSessionStore } from "@/stores/session.store";

export default function Inbox({ isMobile }: { isMobile?: boolean }) {
  const appStore = useAppStore();
  const [sessionInvites, setSessionInvites] = useState<any[]>([]);
  const { ref, isComponentVisible, setIsComponentVisible } =
    useClickOutside(false);

  useEffect(() => {
    setSessionInvites(useSessionStore.getState().sessionInvites);
    const unsub = useSessionStore.subscribe(
      (state) => state.sessionInvites,
      (invites, prevInvites) => {
        if (invites.length != prevInvites.length) {
          setSessionInvites(invites);
        }
      }
    );
    return () => {
      unsub();
    };
  }, []);

  async function accept(sessionId: string) {
    try {
      await acceptInvite(sessionId);
      useSessionStore.setState({
        sessionInvites: useSessionStore
          .getState()
          .sessionInvites.filter((invite) => invite.sessionId != sessionId),
      });
    } catch (e) {
      console.log(e);
    }
  }

  async function decline(sessionId: string) {
    try {
      await declineInvite(sessionId);
      useSessionStore.setState({
        sessionInvites: useSessionStore
          .getState()
          .sessionInvites.filter((invite) => invite.sessionId != sessionId),
      });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <>
      <div
        className="relative "
        onClick={(e) => {
          if (!isMobile) {
            setIsComponentVisible(!isComponentVisible);
          } else {
            appStore.setMobileMenuComponent(<InboxMenu />);
          }
        }}
        ref={ref}
      >
        <div className="hover:scale-105 ease-in-out duration-200 cursor-pointer h-20 flex items-center justify-center">
          <IconInbox className="lg:w-6 lg:h-6 w-8 h-8" strokeWidth={2} />
          <div className="rounded-full bg-primary-500 w-5 h-5 absolute bottom-3 -left-1 flex items-center justify-center">
            <span className="text-xs">{sessionInvites.length}</span>
          </div>
        </div>
        {isComponentVisible && (
          <div
            className="absolute right-0 min-h-[150px] w-[400px] bg-dark shadow-md rounded-b-xl z-20 px-4 py-2"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div>
              <h6 className="uppercase font-bold text-sm text-center">Inbox</h6>
              <div className="absolute flex items-center justify-end space-x-2 top-2 right-4">
                <IconSettings
                  className="hover:scale-105 ease-in-out duration-200 cursor-pointer"
                  strokeWidth={2}
                />
                <IconX
                  className="hover:scale-105 ease-in-out duration-200 cursor-pointer"
                  strokeWidth={2}
                  onClick={() => {
                    setIsComponentVisible(false);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-1/2 h-[2px] bg-white my-2"></div>
              <div className="flex flex-col mt-2 space-y-6 mb-4">
                {sessionInvites.map((invite) => (
                  <div key={invite.sessionId} className="flex items-center">
                    <div className="bg-light-dark opacity-90 rounded-full h-10 w-10 px-2 py-2 flex items-center justify-center">
                      <IconHeartPlus strokeWidth={2} />
                    </div>
                    <div className="flex flex-col ml-8">
                      <h6 className="font-bold uppercase text-sm">
                        Session invite
                      </h6>
                      <span className="text-xs">
                        {invite.initiatorUid} has invited you to session{" "}
                        {invite.sessionId}!
                      </span>
                    </div>
                    <div className="flex-grow flex justify-end space-x-2">
                      <button
                        className="hover:scale-105 ease-in-out duration-200 cursor-pointer"
                        onClick={() => {
                          accept(invite.sessionId);
                        }}
                      >
                        <IconCheck className="text-primary-500" />
                      </button>
                      <button
                        className="hover:scale-105 ease-in-out duration-200 cursor-pointer"
                        onClick={() => {
                          decline(invite.sessionId);
                        }}
                      >
                        <IconX className="text-light-dark" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
