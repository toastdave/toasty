"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Link, SearchIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";

const SearchMobile = () => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    console.log("Input focused");
  };

  const handleBlur = () => {
    setIsFocused(false);
    console.log("Input blurred");
  };

  return (
    <>
    <Button variant='ghost' size='icon' className='' onClick={() => setIsFocused(!isFocused)}>
      <SearchIcon className="!w-6 !h-6"  onClick={() => setIsFocused(!isFocused)} />
    </Button>

      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out z-50 ${
          isFocused
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex h-full">
          <div className="flex-1" onClick={() => setIsFocused(false)}></div>
          <div
            className={`w-full rounded-l-lg bg-muted h-full transition-transform duration-300 ease-in-out ${
              isFocused ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="p-4 flex flex-col h-full">
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsFocused(false)}
                >
                  <XIcon />
                </Button>
              </div>
              <div className="flex flex-col gap-4 flex-1">
                <Link href="/">Home</Link>
                <Link href="/">About</Link>
                <Link href="/">Contact</Link>
              </div>
              <div className="flex gap-4 justify-end">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchMobile;
