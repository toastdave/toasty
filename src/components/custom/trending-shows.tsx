import React from 'react'
import ImageCard from './image-card'

export const revalidate = 3600 // invalidate every hour

const TrendingShows = async () => {
    const trendingShows = await fetch(`https://api.themoviedb.org/3/trending/tv/week`, 
        {
            headers: {
                Authorization: `Bearer ${process.env.TMDB_AUTH}`
            }
        }
    )

    const data = await trendingShows.json()

    console.log(data)


  
  return (
    <div className='flex flex-col gap-2'>
        {data.results.map((show: any) => (
            <div key={show.id} className='flex gap-4 bg-muted p-2 rounded-md'>
                <ImageCard imageUrl={show.backdrop_path} />
                <div className='flex flex-col gap-2'>
                    <h2>{show.name}</h2>
                    <p>{show.vote_average}</p>
                </div>
            </div>
        ))}
    </div>
  )
}

export default TrendingShows