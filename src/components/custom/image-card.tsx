import React from 'react'
import Image from 'next/image'


const ImageCard = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div>
        <Image src={`https://image.tmdb.org/t/p/w500${imageUrl}`} alt="Image Card" width={500} height={500} className='rounded w-6 h-12 object-cover outline-2 outline-gray-300' />
    </div>
  )
}

export default ImageCard