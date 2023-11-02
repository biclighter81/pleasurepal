import FooterWave from "../blob/FooterWave";
import Button from "./interaction/Button";

export default function Footer() {
  return (
    <div className="w-full bg-gradient-to-br from-[#BE6AFF] to-[#DA45DD] flex flex-col  h-[300px] px-10 py-10">
      <div className="">
        <h2 className="text-3xl font-black uppercase">Convinced?</h2>
        <h6 className="uppercase font-semibold text-sm">
          Did we convince you?
        </h6>
        <div className="bg-white h-[3px] w-[120px]"></div>
        <p className="mt-2 font-light text-sm max-w-xl">
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
          nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
          sed diam voluptua.
        </p>
        <div className="mt-4">
          <Button theme="white" text="Get Started!" href="#" />
        </div>
      </div>
    </div>
  );
}
