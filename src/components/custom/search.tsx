'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '../ui/input'

const Search = () => {
  const [isFocused, setIsFocused] = useState(false)


  const handleFocus = () => {
    setIsFocused(true)
    console.log('Input focused')
    
   
  }

  const handleBlur = () => {
      setIsFocused(false)
      console.log('Input blurred')
  }

  return (
    <div className='flex-1 relative'>
        <Input 
          type="text" 
          placeholder="Search" 
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={isFocused ? 'ring-2 ring-primary' : ''}
        />

        {isFocused && (
          <div 
            className='fixed left-1/2 -translate-x-1/2 h-full w-1/2'
          >
            <div className='flex flex-col w-full h-full mt-4 bg-muted rounded-lg'>
                
            </div>
        </div>
        )}
    </div>
  )
}

export default Search