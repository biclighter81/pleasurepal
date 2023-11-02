import { acceptReq, blockUser, declineReq } from "@/lib/functions/friends";
import { useAppStore } from "@/stores/app.store";
import {
  IconArrowLeft,
  IconBan,
  IconCheck,
  IconHeartPlus,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import Button from "../interaction/Button";
import { useFriendStore } from "@/stores/friend.store";

export default function FriendRequestMenu() {
  const appStore = useAppStore();
  const [requests, setRequests] = useState<{ from: string; to: string }[]>([]);

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
        className="flex items-center relative"
        onClick={() => {
          appStore.setMobileMenuComponent(null);
        }}
      >
        <IconArrowLeft className="w-8 h-8" />
        <div className="absolute w-full flex justify-center">
          <h4 className="uppercase font-bold text-xl">Friendship Requests</h4>
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        {requests.length ? (
          requests.map((request) => (
            <div key={request.from} className="bg-dark px-6 py-4 rounded-lg">
              <div className="flex items-center" key={request.to}>
                <div className="bg-light-dark opacity-90 rounded-full h-10 w-10 px-2 py-2 flex items-center justify-center">
                  <IconHeartPlus strokeWidth={2} />
                </div>
                <div className="flex flex-col ml-8 space-y-1">
                  <h6 className="font-bold uppercase text-sm">
                    Friend Request
                  </h6>
                  <span className="text-xs">
                    {request.from} wants to be your friend!
                  </span>
                </div>
                <div className="flex-grow flex justify-end space-x-4">
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
                  <button
                    className="hover:scale-105 ease-in-out duration-200 cursor-pointer"
                    onClick={() => {
                      blockUser(request.from);
                    }}
                  >
                    <IconBan className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center flex-col space-y-12">
            <p>You do not have any friendship requests!</p>
            <Button
              text="Find friends"
              theme="primary-gradient"
              href="/profile"
            />
          </div>
        )}
      </div>
    </>
  );
}
