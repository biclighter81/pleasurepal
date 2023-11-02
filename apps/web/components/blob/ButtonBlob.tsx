import Button from "../app/interaction/Button";

export default function ButtonBlob() {
  return (
    <>
      <div className="h-1/2 lg:mt-12 ml-12 mr-12 relative w-fit">
        <svg viewBox="0 0 586 528" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[500px] sm:h-auto w-[380px]">
          <path d="M407.393 106.108C441.195 132.837 471.3 160.842 506.814 201.874C542.327 242.905 609.605 276.596 577.602 346.668C562.039 380.744 525.723 428.398 471.445 459.973C417.168 491.573 335.041 491.463 281.26 513.919C227.507 536.349 156.453 532.181 104.19 499.982C51.9268 467.782 18.4277 407.525 5.95522 346.668C-6.48967 285.786 2.06447 224.278 17.8482 160.816C33.632 97.3547 56.5902 31.9653 104.576 9.61309C152.562 -12.7652 225.548 7.91973 280.791 30.9754C336.062 54.0049 373.562 79.4052 407.393 106.108Z" fill="url(#paint0_linear_6_31)" />
          <defs>
            <linearGradient id="paint0_linear_6_31" x1="37.9595" y1="3.87777e-07" x2="492.618" y2="582.381" gradientUnits="userSpaceOnUse">
              <stop stopColor="#BE6AFF" />
              <stop offset="1" stopColor="#DA45DD" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute top-0 xl:top-10 left-16 sm:left-20 pt-8 sm:pt-14 right-0 pr-14 sm:pr-28">
          <h3 className="font-extrabold uppercase text-xl">
            Try our
            <br />
            Discord Bot!
          </h3>
          <div className="w-1/2 h-[3px] bg-white my-2"></div>
          <p className="mb-5 sm:mb-10 text-sm sm:text-md">
            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
            nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
            erat, sed diam voluptua.
          </p>
          <Button text="Add To Server" theme="light-dark" />
        </div>
      </div>
    </>
  );
}
