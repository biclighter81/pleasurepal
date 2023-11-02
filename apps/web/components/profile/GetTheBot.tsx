import Link from "next/link";
import Button from "../app/interaction/Button";

export default function GetTheBot() {
  return (
    <Link
      href={
        "https://discord.com/api/oauth2/authorize?client_id=1073750713928257538&permissions=2048&scope=bot"
      }
      passHref
      legacyBehavior
    >
      <a target="_blank" rel="noreferrer">
        <Button text="Get the bot" theme="dark" />
      </a>
    </Link>
  );
}
