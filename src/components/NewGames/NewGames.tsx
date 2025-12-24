import React, { useState, useEffect } from "react";

interface GameDetails {
  _id: string;
  id: string;
  name: string;
  description: string;
  yearPublished: string;
  minPlayers: string;
  maxPlayers: string;
  playingTime: string;
  minAge: string;
  categories: string[];
  mechanics: string[];
  thumbnail: string;
  designer: string[];
  artist: string[];
  publisher: string[];
}

const NewGames: React.FC = () => {
  const [gameDetails, setGameDetails] = useState<GameDetails[]>([]);
  const [allGames, setAllGames] = useState<GameDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState({
    minPlayers: "",
    maxPlayers: "",
    minAge: "",
    categories: "",
    mechanics: "",
    designers: "",
    artist: "",
    publishers: "",
    playingTime: "", // Add playingTime filter
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
    setCurrentPage(1); // Reset to first page on filter change
  };

  const resetFilters = () => {
    setFilters({
      minPlayers: "",
      maxPlayers: "",
      minAge: "",
      categories: "",
      mechanics: "",
      designers: "",
      artist: "",
      publishers: "",
      playingTime: "", // Reset playingTime filter
    });
    setCurrentPage(1); // Reset to first page on reset
  };

  const getUniqueOptionsWithCount = (
    games: GameDetails[],
    key: keyof GameDetails
  ) => {
    const options = games.map((game) => game[key]);
    const optionCounts = options
      .flat()
      .reduce((acc: Record<string, number>, option: string) => {
        acc[option] = (acc[option] || 0) + 1;
        return acc;
      }, {});
    return Object.entries(optionCounts).sort(
      ([, countA], [, countB]) => countB - countA
    );
  };

  const filteredGames = (games: GameDetails[]) => {
    return games.filter((game) => {
      return (
        (filters.minPlayers === "" ||
          game.minPlayers.includes(filters.minPlayers)) &&
        (filters.maxPlayers === "" ||
          game.maxPlayers.includes(filters.maxPlayers)) &&
        (filters.minAge === "" || game.minAge.includes(filters.minAge)) &&
        (filters.categories === "" ||
          game.categories.includes(filters.categories)) &&
        (filters.mechanics === "" ||
          game.mechanics.includes(filters.mechanics)) &&
        (filters.designers === "" ||
          game.designer.includes(filters.designers)) &&
        (filters.artist === "" || game.artist.includes(filters.artist)) &&
        (filters.publishers === "" ||
          game.publisher.includes(filters.publishers)) &&
        (filters.playingTime === "" || game.playingTime === filters.playingTime) // Ensure exact match for playingTime
      );
    });
  };

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/games/2026`
        );
        const data = await response.json();
        setGameDetails(data.games);
        setAllGames(data.games);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching game details:", error);
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, []);

  if (loading) {
    return (
      <p>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed"
          disabled
        >
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading... this may take a while I'm on free tier servers
        </button>
      </p>
    );
  }

  const filteredGameDetails = filteredGames(gameDetails);
  const totalPages = Math.ceil(filteredGameDetails.length / itemsPerPage);
  const currentGames = filteredGameDetails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const minPlayersOptions = getUniqueOptionsWithCount(allGames, "minPlayers");
  const maxPlayersOptions = getUniqueOptionsWithCount(allGames, "maxPlayers");
  const minAgeOptions = getUniqueOptionsWithCount(allGames, "minAge");
  const categoriesOptions = getUniqueOptionsWithCount(allGames, "categories");
  const mechanicsOptions = getUniqueOptionsWithCount(allGames, "mechanics");
  const designersOptions = getUniqueOptionsWithCount(allGames, "designer");
  const artistOptions = getUniqueOptionsWithCount(allGames, "artist");
  const publishersOptions = getUniqueOptionsWithCount(allGames, "publisher");
  const playingTimeOptions = getUniqueOptionsWithCount(allGames, "playingTime"); // Add playingTime options

  return (
    <div className="max-w-[1600px] mx-auto">
      <h2 className="text-2xl">2026 Games</h2>
      <div className="mb-4 p-4 border rounded bg-gray-100">
        <h3 className="mb-2 text-xl font-bold">Filter Games</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <select
            name="minPlayers"
            value={filters.minPlayers}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Min Players</option>
            {minPlayersOptions.map(([option, count]) => (
              <option key={option} value={option}>
                {option} ({count})
              </option>
            ))}
          </select>
          <select
            name="maxPlayers"
            value={filters.maxPlayers}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Max Players</option>
            {maxPlayersOptions.map(([option, count]) => (
              <option key={option} value={option}>
                {option} ({count})
              </option>
            ))}
          </select>
          <select
            name="minAge"
            value={filters.minAge}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Min Age</option>
            {minAgeOptions.map(([option, count]) => (
              <option key={option} value={option}>
                {option} ({count})
              </option>
            ))}
          </select>
          <select
            name="categories"
            value={filters.categories}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Categories</option>
            {categoriesOptions.map(([option, count]) => (
              <option key={option} value={option}>
                {option} ({count})
              </option>
            ))}
          </select>
          <select
            name="mechanics"
            value={filters.mechanics}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Mechanics</option>
            {mechanicsOptions.map(([option, count]) => (
              <option key={option} value={option}>
                {option} ({count})
              </option>
            ))}
          </select>
          <select
            name="designers"
            value={filters.designers}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Designers</option>
            {designersOptions.map(([option, count]) => (
              <option key={option} value={option}>
                {option} ({count})
              </option>
            ))}
          </select>
          <select
            name="artist" // Change from artists to artist
            value={filters.artist} // Change from artists to artist
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Artists</option>
            {artistOptions.map(([option, count]) => (
              <option key={option} value={option}>
                {option} ({count})
              </option>
            ))}
          </select>
          <select
            name="publishers"
            value={filters.publishers}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Publishers</option>
            {publishersOptions.map(([option, count]) => (
              <option key={option} value={option}>
                {option} ({count})
              </option>
            ))}
          </select>
          <select
            name="playingTime"
            value={filters.playingTime}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Playing Time</option>
            {playingTimeOptions.map(([option, count]) => (
              <option key={option} value={option}>
                {option} ({count})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={resetFilters}
          className="mt-4 p-2 bg-red-500 text-white rounded w-full sm:w-auto"
        >
          Reset Filters
        </button>
      </div>
      <div>
        {currentGames.length === 0 ? (
          <p>
            No games returned, this likely means the server needs to wake up try
            again in 2 minutes.
          </p>
        ) : (
          currentGames.map((game) => (
            <div
              className="flex flex-col md:flex-row shadow border-gray-700 bg-white my-4"
              key={game._id}
            >
              <div className="w-full md:w-[200px] flex-shrink-0">
                <img
                  src={game.thumbnail}
                  alt={game.name}
                  className="w-full"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col h-full p-4 leading-normal">
                <h3 className="mb-2 text-2xl font-bold tracking-tight">
                  {game.name} ({game.yearPublished})
                </h3>
                <p>
                  <strong>Designers:</strong> {game.designer.join(", ")}
                </p>
                <p>
                  <strong>Artists:</strong> {game.artist.join(", ")}
                </p>
                <p>
                  <strong>Publishers:</strong> {game.publisher.join(", ")}
                </p>
                <p>
                  <strong>Players:</strong> {game.minPlayers} -{" "}
                  {game.maxPlayers}
                </p>
                <p>
                  <strong>Playing Time:</strong> {game.playingTime} minutes
                </p>
                <p>
                  <strong>Min Age:</strong> {game.minAge}+
                </p>
                <p>
                  <strong>Categories:</strong> {game.categories.join(", ")}
                </p>
                <p>
                  <strong>Mechanics:</strong> {game.mechanics.join(", ")}
                </p>
                <p>
                  <strong>Description:</strong>{" "}
                  <span
                    dangerouslySetInnerHTML={{ __html: game.description }}
                  ></span>
                </p>
                <div className="p-4 w-full flex">
                  <a
                    className="text-center w-full mt-4 p-4 border-2 border-slate-300 hover:bg-slate-200"
                    href={`https://boardgamegeek.com/boardgame/${game.id}`}
                    target="_blank"
                  >
                    View on BGG
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 mx-2 border rounded"
        >
          Previous
        </button>
        <span className="p-2">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="p-2 mx-2 border rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default NewGames;
