'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { MenuIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
const Menu = () => {
  const [open, setOpen] = useState(false)
  
  return (
    <div>
      <Button 
        variant='outline' 
        size='icon' 
        className='rounded-full' 
        onClick={() => setOpen(!open)}
      >
      </Button>
      
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className='flex h-full'>
          <div className='flex-1' onClick={() => setOpen(false)}></div>
          <div className={`w-80 rounded-l-lg bg-muted h-full transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-4 flex flex-col h-full">
              <Button 
                variant='ghost' 
                size='icon' 
                className='rounded-full' 
                onClick={() => setOpen(false)}
              >
                <XIcon />
              </Button>
              <div className='flex flex-col gap-4 flex-1'>
                    <Link href='/'>Home</Link>
                    <Link href='/'>About</Link>
                    <Link href='/'>Contact</Link>
              </div>
            <div className='flex flex-col gap-4'>
                <ThemeToggle />
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Menu