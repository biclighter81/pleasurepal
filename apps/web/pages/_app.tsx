import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import Layout from "../components/app/Layout";
import { useEffect } from "react";
import Head from "next/head";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { initSocket } from "@/lib/socket/socket";
import { useAppStore } from "@/stores/app.store";
import { Socket } from "socket.io-client";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const appStore = useAppStore();
  useEffect(() => {
    let socket: Socket | undefined;
    initSocket(appStore.isProduction).then((s) => {
      socket = s;
    });
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>pleasurepal</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        ></meta>
      </Head>
      <ToastContainer />
      <SessionProvider session={session} refetchInterval={5 * 60}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SessionProvider>
    </>
  );
}
