import React from 'react'
import Image from 'next/image'
import ItemHeader from '@/components/custom/item-page/item-header'
export default async function Page({
    params,
  }: {
    params: Promise<{ type: 'movie' | 'tv', itemid: string }>
  }) {
    console.log(params)

    const { type, itemid } = await params

    const item = await fetch(`https://api.themoviedb.org/3/${type}/${itemid}`, {
        headers: {
            Authorization: `Bearer ${process.env.TMDB_AUTH}`,
        },
    })
    
    const data = await item.json()

    console.log(data)

    return <div>
      <ItemHeader name={data.name} poster_path={data.poster_path} overview={data.overview} />
    </div>
  }