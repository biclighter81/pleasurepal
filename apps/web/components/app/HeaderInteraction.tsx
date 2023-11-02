import { signIn, signOut, useSession } from "next-auth/react";
import Button from "./interaction/Button";
import ProfileAvatar from "./interaction/ProfileAvatar";
import FriendRequests from "./notifications/FriendRequest";
import Inbox from "./notifications/Inbox";

export default function HeaderInteraction() {
  const { data: session } = useSession();

  return (
    <div className="hidden md:block">
      {!session ? (
        <div className="flex space-x-6">
          <Button
            text="Sign Up"
            theme="primary-gradient"
            onClick={() => signIn("keycloak")}
          />
          <Button
            text="Login"
            theme="light-dark"
            onClick={() => signIn("keycloak")}
          />
        </div>
      ) : (
        <div className="flex items-center space-x-8">
          <Inbox />
          <FriendRequests />
          <ProfileAvatar />
          <Button text="Logout" theme="light-dark" onClick={() => signOut()} />
        </div>
      )}
    </div>
  );
}
