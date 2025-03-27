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
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out z-40 ${
          isFocused
          ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`w-full rounded-b-lg bg-muted h-2/3 transition-transform duration-300 ease-in-out z-50 ${
              isFocused ? "translate-y-0" : "-translate-y-full"
              }`}
          >
            <div className="p-4 flex flex-col h-full">
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className=""
                  onClick={() => setIsFocused(false)}
                >
                  <XIcon className='!w-6 !h-6' />
                </Button>
              </div>
              
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsFocused(false)}></div>
        </div>
      </div>
    </>
  );
};

export default SearchMobile;
