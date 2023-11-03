import React from 'react';
import NextAuthProvider from '../lib/context/nextauth-cli.ctx';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import "./globals.css";
import Footer from '../components/app/Footer';
import ProfileSidebar from '../components/app/ProfileSidebar';
import Header from '../components/app/Header';
import { ToastContainer } from 'react-toastify';
import SocketProvider from '../lib/context/socket.ctx';


export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  return (
    <html lang='en'>
      <head>
        <title>pleasurepal</title>
      </head>
      <body className='h-[100%] flex flex-col text-white'>
        <ToastContainer />
        <NextAuthProvider session={session}>
          <SocketProvider>
            <Header />
            <div className="bg-light-dark overflow-y-scroll overflow-x-hidden h-[100%]">
              <ProfileSidebar />
              <div className="relative overflow-y-auto overflow-x-hidden flex flex-col w-full">
                <div className="block">{children}</div>
                <div>
                  <Footer />
                </div>
              </div>
            </div>
          </SocketProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
