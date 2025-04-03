import React from 'react'
import Image from 'next/image'

const ItemHeader = ({name, poster_path}: {name: string, poster_path: string}) => {
  return (
    <div className='flex w-full'>
        <Image src={`https://image.tmdb.org/t/p/w500/${poster_path}`} alt="Image Card" width={500} height={500} className='rounded w-36 h-48 object-cover' />
        <h1 className='text-2xl font-bold pl-4'>{name}</h1>
    </div>
  )
}

export default ItemHeader