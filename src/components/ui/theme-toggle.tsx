"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button 
    className="" 
    variant="outline" 
    size="icon" 
    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="h-[1.2rem] w-[1.2rem] absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
