import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Menu from "@/components/custom/menu";
export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="p-2 flex">
        <div className="flex-1">
        </div>
        <Menu />

      </header>
      <h1>Search</h1>
    </div>
  );
}
