"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Link, SearchIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";

const Search = () => {
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add/remove overflow hidden on body when dropdown is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />
      
      <div className="relative flex-1 z-50 flex flex-col items-center" ref={searchRef}>
        <Input
          type="text"
          placeholder="Search"
          onFocus={() => setIsOpen(true)}
          value={inputValue}
          onChange={handleInputChange}
          className={`w-full transition-all duration-200 ${isOpen ? "ring-2 ring-primary" : ""}`}
        />
        
        {isOpen && (
          <div className="w-full mt-2 bg-muted border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto min-w-60">
            <div className="p-3">
              <Button variant="ghost" size="icon" className="w-full justify-start">
                <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">
                  <SearchIcon className="!w-6 !h-6" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Search;
