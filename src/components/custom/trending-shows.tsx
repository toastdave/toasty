import React from "react";
import ImageCard from "./image-card";

export const revalidate = 3600; // invalidate every hour

const TrendingShows = async () => {
  const trendingShows = await fetch(
    `https://api.themoviedb.org/3/trending/tv/week`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_AUTH}`,
      },
    }
  );

  const data = await trendingShows.json();

  console.log(data);

  return (
    <div className="flex gap-2 w-full overflow-x-auto">
      {data.results.map((show: any, index: number) => (
        <div
          key={show.id}
          className="flex gap-2 p-2 rounded-md w-full relative"
        >
          <div className="absolute top-0 left-0 w-6 h-12 bg-background/50 blur-sm"></div>
          <p className="text-3xl font-bold absolute top-0 left-0">
            {index + 1}
          </p>
          <ImageCard key={show.id} imageUrl={show.poster_path} />
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
