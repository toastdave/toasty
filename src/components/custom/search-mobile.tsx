"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Link, SearchIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";

const SearchMobile = () => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
    console.log("Input focused");
  };

  const handleBlur = () => {
    setIsFocused(false);
    console.log("Input blurred");
  };

  useEffect(() => {
    if (isFocused && inputRef.current) {
      // Small delay to ensure the input is visible before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isFocused]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFocused) {
        setIsFocused(false);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleEscapeKey);

    // Clean up event listener
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isFocused]);

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
            <div className="p-4 flex flex-col h-full gap-2">
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
              <div className="flex flex-col gap-2 rounded-lg">
                <Input
                  type="text"
                  placeholder="Search"
                  className="w-full"
                  ref={inputRef}
                />
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
