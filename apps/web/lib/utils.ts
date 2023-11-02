import { identicon } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { RefObject } from "react";

function getAvatar(email: string) {
    const avatar = createAvatar(identicon, {
        seed: email,
        size: 28,
    });
    return avatar;
}

function handleChatScroll(conversation: any, chatRef: RefObject<HTMLDivElement> | undefined) {
    if (!chatRef?.current) return;

    const latestMessage = chatRef.current.children.item(
        conversation.messages.length % 10 == 0
            ? 98
            : (conversation.messages.length % 10) - 2
    );
    if (!latestMessage) return;
    //get scrollheight of latest message relative to chat container
    const rect = latestMessage.getBoundingClientRect();
    chatRef.current.scrollTop =
        rect.top +
        latestMessage.scrollHeight -
        chatRef.current.offsetTop -
        chatRef.current.scrollTop;
}

export { getAvatar, handleChatScroll };