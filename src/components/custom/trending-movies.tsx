import React from "react";
import ImageCard from "./image-card";
import { Lobster } from "next/font/google";

// Initialize the font at module scope
const lobsterFont = Lobster({ 
    weight: '400',
    subsets: ['latin']
  });

export const revalidate = 3600; // invalidate every hour

const TrendingMovies = async () => {
  const trendingMoviesPageOne = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_AUTH}`,
      },
    }
  );

  const trendingMoviesPageTwo = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?page=2`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_AUTH}`,
      },
    }
  );

  const dataOne = await trendingMoviesPageOne.json();
  const dataTwo = await trendingMoviesPageTwo.json();

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
            <p className={`absolute top-0 -left-4 rounded-full text-7xl font-bold ${lobsterFont.className}`}>
              {index + 1}
            </p>
          </div>
          <ImageCard key={index} imageUrl={show.poster_path} itemId={show.id} type="movie" />
          {/* <div className='flex flex-col'>
                    <h2 className='text-lg font-bold'>{show.name}</h2>
                    <p className='text-sm text-muted-foreground'>{show.vote_average}</p>
                </div> */}
        </div>
      ))}
    </div>
  );
};

export default TrendingMovies;
