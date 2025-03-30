import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Menu from "@/components/custom/nav/menu";
import Search from "@/components/custom/nav/search";
import Header from "@/components/custom/nav/header";
import ImageCard from "@/components/custom/image-card";


export default function Home() {
  return (
    <div>
      <main className="p-2">
        howdy
        <ImageCard />
      </main>
    </div>
  );
}
