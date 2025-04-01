import React from 'react'
import Image from 'next/image'


const ImageCard = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div>
        <Image src={`https://image.tmdb.org/t/p/w500${imageUrl}`} alt="Image Card" width={500} height={500} className='rounded min-w-24 min-h-36 object-cover' />
    </div>
  )
}

export default ImageCard