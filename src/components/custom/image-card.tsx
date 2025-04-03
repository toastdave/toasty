'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const ImageCard = ({ imageUrl, itemId, type }: { imageUrl: string, itemId: number, type: 'tv' | 'movie' }) => {
  const router = useRouter()
  return (
    <div onClick={() => router.push(`/${type}/${itemId}`)}>
        <Image src={`https://image.tmdb.org/t/p/w500${imageUrl}`} alt="Image Card" width={500} height={500} className='rounded min-w-36 min-h-48 object-cover' />
    </div>
  )
}

export default ImageCard