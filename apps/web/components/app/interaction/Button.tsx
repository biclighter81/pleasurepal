import { useRouter } from "next/router";

export default function Button({
  text,
  onClick,
  theme,
  href,
  icon,
  disabled,
  iconPosition = "start",
}: {
  text: string;
  onClick?: () => void;
  href?: string;
  theme?:
    | "primary"
    | "primary-gradient"
    | "light-dark"
    | "white"
    | "danger"
    | "warn"
    | "dark";
  icon?: React.ReactNode;
  disabled?: boolean;
  iconPosition?: "start" | "end";
}) {
  const router = useRouter();
  const color =
    theme === "primary"
      ? "bg-primary-500"
      : theme === "primary-gradient"
      ? "bg-gradient-to-br from-primary-500 to-secondary-500"
      : theme === "white"
      ? "bg-white text-black"
      : theme === "danger"
      ? "bg-red-400"
      : theme === "warn"
      ? "bg-yellow-400"
      : theme === "dark"
      ? "bg-dark"
      : "bg-light-dark";

  return (
    <button
      className={`px-12 py-3 text-sm rounded-full uppercase font-semibold hover:scale-105 transition duration-300 ease-in-out ${color} h-10 flex items-center ${
        disabled && "opacity-50 cursor-not-allowed"
      }}`}
      disabled={disabled}
      onClick={() => {
        if (onClick) {
          onClick();
        }
        if (href) {
          router.push(href);
        }
      }}
    >
      <div className="flex items-center space-x-2 w-full justify-center">
        {iconPosition === "start" && icon}
        <div className="whitespace-nowrap">{text}</div>
        {iconPosition === "end" && icon}
      </div>
    </button>
  );
}
