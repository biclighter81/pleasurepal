import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import Footer from "./Footer";
import Header from "./Header";
import ProfileSidebar from "./ProfileSidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error) {
      signIn("keycloak");
    }
  }, [session]);

  return (
    <div>
      <Header />
      <ProfileSidebar />
      <div className="bg-light-dark h-screen overflow-y-scroll flex-col overflow-x-hidden">
        <div className="relative overflow-y-auto overflow-x-hidden flex flex-col min-h-screen">
          <div className="flex-grow">{children}</div>
          <div>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
