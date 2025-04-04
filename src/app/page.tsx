import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Menu from "@/components/custom/nav/menu";
import Search from "@/components/custom/nav/search";
import Header from "@/components/custom/nav/header";
import ImageCard from "@/components/custom/image-card";
import TrendingShows from "@/components/custom/trending-shows";
import TrendingMovies from "@/components/custom/trending-movies";
export default function Home() {
  return (
    <div>
      <main className="p-2 flex flex-col gap-2">
        <p className="text-2xl font-bold">Toasty Shows</p>
        <TrendingShows />
        <p className="text-2xl font-bold">Toasty Movies</p>
        <TrendingMovies />
      </main>
    </div>
  );
}
