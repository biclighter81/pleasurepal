'use client';
import { getSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import {
    IconCheck,
    IconChecks,
    IconChevronDown,
    IconChevronLeft,
    IconSend,
} from "@tabler/icons-react";
import { useChatStore } from "@/stores/chat.store";
import { useFriendStore } from "@/stores/friend.store";
import { fetcher } from "@/lib/fetcher";
import useSWRInfinite from "swr/infinite";
import InfiniteScroll from "react-infinite-scroll-component";
import { getAvatar } from "../../../../lib/utils";
import LoadingSpinner from "../../../../components/app/misc/LoadingSpinner";

export default function DirectChat() {
    const [message, setMessage] = useState<string>("");
    const [newMessages, setNewMessages] = useState<number>(0);
    const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
    const [withinThreshold, setWithinThreshold] = useState<boolean>(true);
    const params = useParams()
    const { uid: friendUid } = params
    const chatRef = useRef<InfiniteScroll>(null);
    const router = useRouter();
    const chatStore = useChatStore()

    const { data: friend, isLoading: friendLoading } = useSWR(
        friendUid && `friends/friend/${friendUid}`,
        fetcher,
        { revalidateOnFocus: false }
    );
    const { data: conversation, isLoading: conversationLoading } = useSWR(
        friendUid && `chat/conversation/direct/${friendUid}`,
        fetcher,
        { revalidateOnFocus: false }
    );

    const getKey = (pageIndex: number, previousPageData: any) => {
        if (!conversation) return null;
        if (previousPageData && !previousPageData.nextOffset) return null;
        if (pageIndex == 0) return `chat/messages/${conversation.id}?offset=0`;
        return `chat/messages/${conversation.id}?offset=${previousPageData.nextOffset}`;
    };

    const { data, size, setSize, mutate } = useSWRInfinite(getKey, fetcher, {
        revalidateFirstPage: false,
        revalidateOnMount: true,
    });

    useEffect(() => {
        const unsub = useChatStore.subscribe(
            (state) => state.messages,
            (msg, prevMsg) => {
                const newMessages = msg
                    .filter(
                        (msg) =>
                            msg.conversation.id === conversation?.id &&
                            !prevMsg.some((m) => m.id === msg.id)
                    )
                newMessages.forEach((msg) => {
                    setNewMessages((prev) => prev + 1);
                    mutate((prev) => {
                        if (!prev)
                            return [
                                {
                                    messages: [msg],
                                },
                            ];
                        prev[0].messages.splice(0, 0, msg);
                        return [...prev];
                    });
                });
            }
        );
        return () => {
            unsub();
        };
    }, [conversation]);

    useEffect(() => {
        if (isAtBottom) {
            setNewMessages(0);
        }
        if (withinThreshold) {
            if (chatRef.current) {
                const target = chatRef.current.getScrollableTarget();
                if (!target) return;
                target.scrollTop = 0;
            }
        }
    }, [newMessages]);

    const messages = useMemo(() => {
        if (!data) return [];
        return data.flatMap((d) => d.messages);
    }, [data]);

    const friendLastReadTimestamp = useMemo(() => {
        if (!conversation?.participants?.length) return null;
        const friend = conversation.participants.find((p: any) => p.participantId == friendUid)
        const readState = chatStore.conversationReadState[conversation.id]
        const lastReadTimestamp = readState && readState[friendUid as string]
        return lastReadTimestamp ?? friend?.lastReadTimestamp
    }, [conversation, chatStore.conversationReadState])

    function readState(sendAt: Date) {
        if (!friendLastReadTimestamp) return <></>;
        if (dayjs(sendAt).isBefore(friendLastReadTimestamp)) {
            return (<IconChecks className="w-4 h-4" />)
        }
        return <IconCheck className="w-4 h-4" />
    }

    async function sendMessage() {
        try {
            const session = await getSession();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/chat/message/${conversation.id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({
                        content: message,
                    }),
                }
            );
            const data = await res.json();
            if (res.ok) {
                setMessage("");
                mutate((prev) => {
                    if (!prev) return [];
                    prev[0].messages.splice(0, 0, data);
                    return [...prev];
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <>
            <div
                className="flex space-x-2 items-center ml-6 mt-3 hover:cursor-pointer"
                onClick={() => router.push("/profile/friends")}
            >
                <IconChevronLeft className="h-5 w-5" />
                <span className="font-bold uppercase text-sm">Back</span>
            </div>
            {friend && (
                <div className="flex mx-8 my-4 items-center space-x-4">
                    <div className="flex items-center space-x-2 h-8 w-8">
                        <img src={getAvatar(friend.email).toDataUriSync()} />
                    </div>
                    <div
                        className={`w-3 h-3 ${useFriendStore
                            .getState()
                            .onlineFriends.includes(friendUid as string)
                            ? "bg-green-400"
                            : "bg-red-400"
                            } rounded-full animate-pulse`}
                    />
                    <h4 className="uppercase font-bold text-2xl">{friend.username}</h4>
                </div>
            )}
            <div className="flex flex-col ">
                {(conversationLoading || friendLoading) && (
                    <div className="absolute top-20 w-full">
                        <div className="w-full h-full flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    </div>
                )}
                <div className="relative w-full">
                    {(newMessages || !isAtBottom) && (
                        <div
                            className="absolute bottom-10 right-8 rounded-lg bg-dark w-10 h-10 flex items-center justify-center space-x-1 hover:cursor-pointer"
                            onClick={() => {
                                if (chatRef.current) {
                                    const target = chatRef.current.getScrollableTarget();
                                    if (!target) return;
                                    target.scrollTop = 0;
                                    setNewMessages(0);
                                }
                            }}
                        >
                            <IconChevronDown className="h-4 w-4 hover:scale-105" />
                            {newMessages > 0 && (
                                <span className="text-xs">{newMessages}</span>
                            )}
                        </div>
                    )}
                    <div
                        id="scrollableDiv"
                        className="h-[300px] overflow-auto flex flex-col-reverse mx-8 my-10"
                        onScroll={() => {
                            if (chatRef.current) {
                                const target = chatRef.current.getScrollableTarget();
                                if (!target) return;
                                if (target.scrollTop < 0) {
                                    setIsAtBottom(false);
                                } else {
                                    setIsAtBottom(true);
                                    setNewMessages(0);
                                }
                                if (target.scrollTop >= -100) {
                                    setWithinThreshold(true);
                                } else {
                                    setWithinThreshold(false);
                                }
                            }
                        }}
                    >
                        <InfiniteScroll
                            className="gap-4"
                            dataLength={messages.length}
                            next={() => setSize(size + 1)}
                            hasMore={data && data[data.length - 1].nextOffset}
                            loader={
                                <div className="flex justify-center">
                                    <LoadingSpinner />
                                </div>
                            }
                            style={{ display: "flex", flexDirection: "column-reverse" }}
                            scrollableTarget="scrollableDiv"
                            endMessage={
                                <p style={{ textAlign: "center" }}>
                                    <b>Yay! You have seen it all</b>
                                </p>
                            }
                            inverse={true}
                            ref={chatRef}
                        >
                            {messages.map((msg, i) => {
                                return (
                                    <div
                                        key={i}
                                        className={`flex w-full ${msg.sender == friendUid ? "justify-start " : "justify-end "
                                            }`}
                                    >
                                        <div
                                            className={`flex flex-col w-fit rounded-lg min-w-[150px] ${msg.sender == friendUid ? "bg-blue-500" : "bg-primary-500"
                                                } px-4 py-2`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <div className="flex flex-grow justify-end">
                                                <div className="text-xs flex space-x-2">
                                                    <p>{dayjs(msg.sendAt).format("hh:mm A")}</p>
                                                    {msg.sender != friendUid && readState(msg.sendAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>)
                            })}
                        </InfiniteScroll>
                    </div>
                    <div className="mt-12">
                        <div className="mt-4 flex flex-col mx-8">
                            <div className="bg-dark px-4 py-2 rounded-lg flex items-center space-x-4">
                                <input
                                    type="text"
                                    className="bg-transparent w-full ring-0 outline-none text-sm font-light text-gray-400"
                                    value={message}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            sendMessage();
                                        }
                                    }}
                                    onChange={(e) => {
                                        setMessage(e.target.value);
                                    }}
                                />
                                <IconSend className="h-5 w-5" onClick={() => sendMessage()} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
