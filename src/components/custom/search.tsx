'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '../ui/input'

const Search = () => {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleFocus = () => {
    setIsFocused(true)
    console.log('Input focused')
    
    // Focus the modal input after a short delay to allow the modal to appear
    setTimeout(() => {
      if (modalInputRef.current) {
        modalInputRef.current.focus()
      }
    }, 50)
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is within our component
    // This prevents closing when focus moves between our inputs
    const relatedTarget = e.relatedTarget as Node
    if (
      !modalRef.current?.contains(relatedTarget) && 
      relatedTarget !== inputRef.current
    ) {
      setIsFocused(false)
      console.log('Input blurred')
    }
  }

  // Handle clicks outside the modal to close it
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsFocused(false)
    }
  }

  // Auto-focus the input when isFocused becomes true
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isFocused])

  return (
    <div className='flex-1'>
        <Input 
          type="text" 
          placeholder="Search" 
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={isFocused ? 'ring-2 ring-primary' : ''}
          ref={inputRef}
        />

        <div 
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isFocused ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={handleBackdropClick}
        >
          <div 
            className='flex w-full h-full justify-center items-center'
            ref={modalRef}
          >
            <div className='flex flex-col w-2/3 h-full items-center pt-24'>

            <Input 
              type="text" 
              placeholder="Search" 
              onBlur={handleBlur}
              className={isFocused ? 'ring-2 ring-primary w-1/2' : 'w-1/2'}
              ref={modalInputRef}
              />
              </div>
          </div>
        </div>
    </div>
  )
}

export default Search