import React from "react";
import Image from "next/image";

const ItemHeader = ({
  name,
  poster_path,
  overview,
}: {
  name: string;
  poster_path: string;
  overview: string;
}) => {
  return (
    <div className="flex w-full p-2 px-4">
      <Image
        src={`https://image.tmdb.org/t/p/w500/${poster_path}`}
        alt="Image Card"
        width={500}
        height={500}
        className="rounded w-36 h-48 object-cover"
      />
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold pl-4">{name}</h1>
        <p className="text-sm text-muted-foreground pl-4">
          {overview.length > 100 ? `${overview.slice(0, 100)}...` : overview}
        </p>
      </div>
    </div>
  );
};

export default ItemHeader;
