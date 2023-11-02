import { getSession } from "next-auth/react";


async function fetchConversation(friendUid: string, messageCount: number) {
    const session = await getSession();
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_PLEASUREPAL_API
        }/api/chat/conversation/direct/${friendUid}?offset=${messageCount}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token}`,
            },
        }
    );
    return res;
}

async function createConversation(friendUid: string) {
    const session = await getSession();
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/chat/conversation/direct/${friendUid}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token}`,
            },
        }
    );
    return res;
}
export { fetchConversation, createConversation }