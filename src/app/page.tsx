import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Menu from "@/components/custom/menu";
import Search from "@/components/custom/search";
import Header from "@/components/custom/header";
export default function Home() {
  return (
    <div className=" bg-red-500">
      <main className="p-2">
        howdy
        <div className="bg-blue-500 h-20 w-full m-2">
          <p>hello</p>
        </div>
        <div className="bg-blue-500 h-20 w-full m-2">
          <p>hello</p>
        </div>
        <div className="bg-blue-500 h-20 w-full m-2">
          <p>hello</p>
        </div>
        <div className="bg-blue-500 h-20 w-full m-2">
          <p>hello</p>
        </div>
        <div className="bg-blue-500 h-20 w-full m-2">
          <p>hello</p>
        </div>
        <div className="bg-blue-500 h-20 w-full m-2">
          <p>hello</p>
        </div>
      </main>
    </div>
  );
}
