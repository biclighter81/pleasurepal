import { useEffect, useState } from "react";
import {
  IconCheck,
  IconHeartPlus,
  IconSettings,
  IconUserBolt,
  IconX,
} from "@tabler/icons-react";
import useClickOutside from "../../../lib/hooks/useClickOutside";
import { useAppStore } from "@/stores/app.store";
import FriendRequestMenu from "../mobile/FriendRequestMenu";
import { acceptReq, declineReq } from "@/lib/functions/friends";
import { useFriendStore } from "@/stores/friend.store";

export default function FriendRequests({ isMobile }: { isMobile?: boolean }) {
  const appStore = useAppStore();
  const [requests, setRequests] = useState<{ from: string; to: string }[]>([]);
  const { ref, isComponentVisible, setIsComponentVisible } =
    useClickOutside(false);

  useEffect(() => {
    setRequests(useFriendStore.getState().friendRequests);
    const unsub = useFriendStore.subscribe(
      (state) => state.friendRequests,
      (requests, prevRequests) => {
        if (requests.length != prevRequests.length) {
          setRequests(requests);
        }
      }
    );
    return () => {
      unsub();
    };
  }, []);

  return (
    <>
      <div
        className="relative "
        onClick={(e) => {
          if (!isMobile) {
            setIsComponentVisible(!isComponentVisible);
          } else {
            appStore.setMobileMenuComponent(<FriendRequestMenu />);
          }
        }}
        ref={ref}
      >
        <div className="hover:scale-105 ease-in-out duration-200 cursor-pointer h-20 flex items-center justify-center">
          <IconUserBolt className="lg:w-6 lg:h-6 w-8 h-8" strokeWidth={2} />
          <div className="rounded-full bg-primary-500 w-5 h-5 absolute bottom-3 -left-1 flex items-center justify-center">
            <span className="text-xs">
              {requests.length > 99 ? "99+" : requests.length}
            </span>
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
              <h6 className="uppercase font-bold text-sm text-center">
                Friend Requests
              </h6>
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
            <div className="flex justify-center">
              <div className="w-1/2 h-[2px] bg-white my-2"></div>
            </div>
            <div className="flex flex-col mt-2 space-y-6 mb-4">
              {requests.map((request) => (
                <div className="flex items-center" key={request.to}>
                  <div className="bg-light-dark opacity-90 rounded-full h-10 w-10 px-2 py-2 flex items-center justify-center">
                    <IconHeartPlus strokeWidth={2} />
                  </div>
                  <div className="flex flex-col ml-8">
                    <h6 className="font-bold uppercase text-sm">
                      Friend Request
                    </h6>
                    <span className="text-xs">
                      {request.from} wants to be your friend!
                    </span>
                  </div>
                  <div className="flex-grow flex justify-end space-x-2">
                    <button
                      className="hover:scale-105 ease-in-out duration-200 cursor-pointer"
                      onClick={() => {
                        acceptReq(request.from);
                      }}
                    >
                      <IconCheck className="text-primary-500" />
                    </button>
                    <button
                      className="hover:scale-105 ease-in-out duration-200 cursor-pointer"
                      onClick={() => {
                        declineReq(request.from);
                      }}
                    >
                      <IconX className="text-light-dark" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
