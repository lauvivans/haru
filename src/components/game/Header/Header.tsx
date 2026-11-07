import { Link } from "react-router";
import { ThemeSwitch } from "@/components/game/ThemeSwitch/ThemeSwitch";

export function Header() {
  return (
    <header className="header">
      <Link className="logo" to="/">
        Haru
      </Link>
      <div className="header__tools">
        <ThemeSwitch />
      </div>
    </header>
  );
}
