import Image from "next/image";
import logo from "../../public/logo.svg";
import Navbar from "./Navbar";
import HeaderInteraction from "./HeaderInteraction";
import Link from "next/link";

export default function Header() {
  return (
    <div className="bg-dark w-full h-20 flex items-center px-8 py-4 sticky z-10">
      <div className="relative h-12 w-32">
        <Link href={"/"}>
          <Image src={logo} alt="logo" fill />
        </Link>
      </div>
      <div className="ml-16 flex-grow sm:flex-auto">
        <Navbar />
      </div>
      <div className="flex-grow lg:flex items-center justify-end hidden">
        <HeaderInteraction />
      </div>
    </div>
  );
}
