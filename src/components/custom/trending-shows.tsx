import React from "react";
import ImageCard from "./image-card";
import { Lobster } from "next/font/google";
import { redirect } from 'next/navigation'

// Initialize the font at module scope
const lobsterFont = Lobster({ 
    weight: '400',
    subsets: ['latin']
  });

export const revalidate = 3600; // invalidate every hour

const TrendingShows = async () => {
  const trendingShowsPageOne = await fetch(
    `https://api.themoviedb.org/3/trending/tv/week`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_AUTH}`,
      },
    }
  );

  const trendingShowsPageTwo = await fetch(
    `https://api.themoviedb.org/3/trending/tv/week?page=2`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_AUTH}`,
      },
    }
  );

  const dataOne = await trendingShowsPageOne.json();
  const dataTwo = await trendingShowsPageTwo.json();

  const data = [...dataOne.results, ...dataTwo.results];

  console.log(data);

  return (
    <div className="flex gap-4 w-full overflow-x-auto no-scrollbar px-4">
      {data.map((show: any, index: number) => (
        <div
          key={index}
          className="flex gap-2 p-2 rounded-md w-full relative"
        >
          <div className="">
            <p className={`absolute top-0 -left-4 text-7xl font-bold ${lobsterFont.className}`}>
              {index + 1}
            </p>-
          </div>
          <ImageCard key={index} imageUrl={show.poster_path} itemId={show.id} type="tv" />
          {/* <div className='flex flex-col'>
                    <h2 className='text-lg font-bold'>{show.name}</h2>
                    <p className='text-sm text-muted-foreground'>{show.vote_average}</p>
                </div> */}
        </div>
      ))}
    </div>
  );
};

export default TrendingShows;
