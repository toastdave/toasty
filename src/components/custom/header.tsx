"use client";

import React from "react";
import Menu from "./menu";
import Search from "./search";
import { useMediaQuery } from "@/hooks/use-media-query";
import SearchMobile from "./search-mobile";

const Header = () => {
  const isMobile = useMediaQuery("(max-width: 480px)");

  return (
    <header className="p-2 h-16">
      {isMobile ? (
        <nav className="flex justify-between w-full">
          <div className="flex-1 flex justify-start ">
            <p className="text-2xl">🔥Toasty</p>
          </div>
          <div className="flex gap-4 items-center">
            <SearchMobile />
            <Menu />
          </div>
        </nav>
      ) : (
        <nav className="grid grid-cols-3 justify-around">
          <div className="col-span-1 flex justify-start">
            <p className="text-2xl">🔥Toasty</p>
          </div>
          <div className="col-span-1">
            <Search />
          </div>
          <div className="col-span-1">
            <div className="flex justify-end">
              <Menu />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
