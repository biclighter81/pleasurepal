export default function BlobTop() {
    return (
        <div className="absolute w-fit right-0 top-0 -mt-32 -mr-16 hidden 2xl:block">
            <svg width="500" height="526" viewBox="0 0 386 526" fill="none" xmlns="http://www.w3.org/2000/svg" className="-rotate-12">
                <path d="M323.757 -30.0368C371.286 -31.7176 416.824 -29.647 476.653 -20.4141C536.481 -11.1811 616.172 -31.0952 644.048 51.5071C657.604 91.6761 664.894 158.349 645.494 224.32C626.114 290.314 560.173 349.462 534.205 407.33C508.239 465.157 448.076 512.872 381.564 523.222C315.053 533.573 242.15 506.557 185.65 463.864C129.153 421.13 89.0171 362.716 53.1855 297.429C17.354 232.141 -14.1975 160.04 7.2036 106.44C28.5847 52.8181 102.916 17.7387 164.831 -2.52827C226.748 -22.8373 276.226 -28.3139 323.757 -30.0368Z" fill="url(#paint0_linear_13_64)" />
                <defs>
                    <linearGradient id="paint0_linear_13_64" x1="-53.5606" y1="146.329" x2="762.761" y2="267.44" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#BE6AFF" />
                        <stop offset="1" stopColor="#DA45DD" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute top-10 left-20 pt-28 right-0 pr-28">
                <h3 className="font-extrabold uppercase text-xl">
                    Check out whats new!
                </h3>
                <h6 className="-mt-1 font-bold">PLEASUREPAL VERSION 0.9</h6>
                <div className="w-1/2 h-[3px] bg-white mb-2"></div>
                <ul className="mb-10 ml-12 mt-4 list-disc list-inside">
                    <li>Bugfixes</li>
                    <li>New commands</li>
                </ul>
            </div>
        </div>
    )
}