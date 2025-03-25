import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Menu from "@/components/custom/menu";
import Search from "@/components/custom/search";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="p-2 grid grid-cols-3 justify-around">
        <div className="col-span-1">
        </div>
        <div className="col-span-1">

        <Search />
        </div>
        <div className="col-span-1">
          <div className="flex justify-end">
            <Menu />
          </div>
        </div>
      </header>
      <main className="p-2">
      </main>
    </div>
  );
}
