"use client";

import React from "react";
import Menu from "./menu";
import Search from "./search";
import { useMediaQuery } from "@/hooks/use-media-query";

const Header = () => {
  const isMobile = useMediaQuery("(max-width: 480px)");

  return (
    <header className="p-2">
      {isMobile ? (
        <nav className="flex justify-between w-full">
          <div className="flex-1 flex justify-start ">
            <p className="text-2xl">🔥</p>
          </div>
          <div className="flex gap-2 items-center">
            <Search />
            <Menu />
          </div>
        </nav>
      ) : (
        <nav className="grid grid-cols-3 justify-around">
          <div className="col-span-1 flex justify-start">
            <p className="text-2xl">🔥</p>
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
