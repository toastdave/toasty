import React from 'react'
import Image from 'next/image'
const ImageCard = () => {
  return (
    <div>
        <Image src="https://image.tmdb.org/t/p/w500/odVlTMqPPiMksmxpN9cCbPCjUPP.jpg" alt="Image Card" width={500} height={500} className='rounded w-12 h-24 object-cover outline-2 outline-gray-300' />
    </div>
  )
}

export default ImageCard