import React, { useState, useEffect, useMemo, useCallback } from "react";

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
  /** ISO date from MongoDB / scrape */
  bggDiscoveredAt?: string | null;
  updatedAt?: string | null;
}

/** Keys used in filters (excludes dates and non-filter fields). */
type GameFilterFieldKey =
  | "minPlayers"
  | "maxPlayers"
  | "minAge"
  | "categories"
  | "mechanics"
  | "designer"
  | "artist"
  | "publisher"
  | "playingTime";

const FILTER_FIELDS: { key: GameFilterFieldKey; label: string }[] = [
  { key: "publisher", label: "Publishers" },
  { key: "designer", label: "Designers" },
  { key: "categories", label: "Categories" },
  { key: "mechanics", label: "Mechanics" },
  { key: "artist", label: "Artists" },
  { key: "playingTime", label: "Playing time" },
  { key: "minPlayers", label: "Min players" },
  { key: "maxPlayers", label: "Max players" },
  { key: "minAge", label: "Min age" },
];

const ARRAY_FIELD_KEYS: ReadonlySet<GameFilterFieldKey> = new Set([
  "categories",
  "mechanics",
  "designer",
  "artist",
  "publisher",
]);

function emptyFilterRecord(): Record<GameFilterFieldKey, string[]> {
  return {
    minPlayers: [],
    maxPlayers: [],
    minAge: [],
    categories: [],
    mechanics: [],
    designer: [],
    artist: [],
    publisher: [],
    playingTime: [],
  };
}

function formatGameDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function gamePassesFilters(
  game: GameDetails,
  include: Record<GameFilterFieldKey, string[]>,
  exclude: Record<GameFilterFieldKey, string[]>
): boolean {
  for (const key of FILTER_FIELDS.map((f) => f.key)) {
    const inc = include[key];
    const exc = exclude[key];
    if (ARRAY_FIELD_KEYS.has(key)) {
      const vals = game[key] as string[];
      if (exc.length > 0 && vals.some((v) => exc.includes(v))) {
        return false;
      }
      if (inc.length > 0 && !vals.some((v) => inc.includes(v))) {
        return false;
      }
    } else {
      const val = String(game[key as keyof GameDetails]);
      if (exc.length > 0 && exc.includes(val)) {
        return false;
      }
      if (inc.length > 0 && !inc.includes(val)) {
        return false;
      }
    }
  }
  return true;
}

const NewGames: React.FC = () => {
  const [gameDetails, setGameDetails] = useState<GameDetails[]>([]);
  const [allGames, setAllGames] = useState<GameDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [includeByField, setIncludeByField] = useState(emptyFilterRecord);
  const [excludeByField, setExcludeByField] = useState(emptyFilterRecord);
  const [currentPage, setCurrentPage] = useState(1);
  const [onlyNewSinceLastRun, setOnlyNewSinceLastRun] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const itemsPerPage = 20;

  const getUniqueOptionsWithCount = useCallback(
    (games: GameDetails[], key: GameFilterFieldKey) => {
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
    },
    []
  );

  const toggleFilter = useCallback(
    (
      field: GameFilterFieldKey,
      value: string,
      mode: "include" | "exclude",
      checked: boolean
    ) => {
      setCurrentPage(1);
      if (mode === "include") {
        setIncludeByField((prev) => {
          const cur = prev[field];
          const nextList = checked
            ? [...new Set([...cur, value])]
            : cur.filter((x) => x !== value);
          return { ...prev, [field]: nextList };
        });
        if (checked) {
          setExcludeByField((prev) => ({
            ...prev,
            [field]: prev[field].filter((x) => x !== value),
          }));
        }
      } else {
        setExcludeByField((prev) => {
          const cur = prev[field];
          const nextList = checked
            ? [...new Set([...cur, value])]
            : cur.filter((x) => x !== value);
          return { ...prev, [field]: nextList };
        });
        if (checked) {
          setIncludeByField((prev) => ({
            ...prev,
            [field]: prev[field].filter((x) => x !== value),
          }));
        }
      }
    },
    []
  );

  const resetFilters = useCallback(() => {
    setIncludeByField(emptyFilterRecord());
    setExcludeByField(emptyFilterRecord());
    setOnlyNewSinceLastRun(false);
    setCurrentPage(1);
  }, []);

  const filteredGames = useCallback(
    (games: GameDetails[]) =>
      games.filter((game) =>
        gamePassesFilters(game, includeByField, excludeByField)
      ),
    [includeByField, excludeByField]
  );

  useEffect(() => {
    const fetchGameDetails = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const base = (import.meta.env.VITE_API_URL ?? "/api").replace(
          /\/$/,
          ""
        );
        const q = onlyNewSinceLastRun ? "?sinceLastRun=true" : "";
        const response = await fetch(`${base}/games/2026${q}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const games = [...(data.games ?? [])].sort(
          (a, b) => Number(a.id) - Number(b.id)
        );
        setGameDetails(games);
        setAllGames(games);
      } catch {
        setLoadError(
          "Could not load games. Start the API (e.g. port 4000) or check your network."
        );
        setGameDetails([]);
        setAllGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [onlyNewSinceLastRun]);

  const optionsByField = useMemo(() => {
    const o: Partial<Record<GameFilterFieldKey, [string, number][]>> = {};
    for (const { key } of FILTER_FIELDS) {
      o[key] = getUniqueOptionsWithCount(allGames, key);
    }
    return o as Record<GameFilterFieldKey, [string, number][]>;
  }, [allGames, getUniqueOptionsWithCount]);

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
              strokeWidth="4"
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
  const totalPages = Math.ceil(filteredGameDetails.length / itemsPerPage) || 1;
  const currentGames = filteredGameDetails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4">
      <h2 className="text-2xl mb-4">2026 Games</h2>
      {loadError ? (
        <p className="mb-4 text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
          {loadError}
        </p>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        <aside className="w-full lg:w-[22rem] shrink-0 border border-slate-200 rounded-lg bg-slate-50 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <h3 className="text-lg font-bold text-slate-800 mb-3">Filters</h3>
          <p className="text-xs text-slate-600 mb-4">
            Include: show only games matching at least one checked value in that
            row (empty = no include rule). Exclude: hide games with any checked
            value. You cannot include and exclude the same value.
          </p>

          <button
            type="button"
            onClick={() => {
              setOnlyNewSinceLastRun((v) => !v);
              setCurrentPage(1);
            }}
            className={`w-full mb-3 px-3 py-2 rounded border-2 text-sm font-medium transition-colors ${
              onlyNewSinceLastRun
                ? "bg-emerald-600 border-emerald-700 text-white"
                : "bg-white border-slate-300 text-slate-800 hover:bg-slate-100"
            }`}
          >
            {onlyNewSinceLastRun
              ? "Showing new since last run"
              : "New since last run only"}
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="w-full mb-4 px-3 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
          >
            Reset filters
          </button>

          <div className="space-y-5">
            {FILTER_FIELDS.map(({ key, label }) => {
              const rows = optionsByField[key] ?? [];
              const idPrefix = `filter-${key}`;
              return (
                <div
                  key={key}
                  className="border border-slate-200 rounded-md bg-white overflow-hidden"
                >
                  <div className="px-2 py-1.5 bg-slate-100 border-b border-slate-200">
                    <span className="text-sm font-semibold text-slate-800">
                      {label}
                    </span>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500">
                          <th className="text-left font-medium py-1 px-2 min-w-0">
                            Value
                          </th>
                          <th className="text-center font-medium py-1 px-1 w-14">
                            Inc
                          </th>
                          <th className="text-center font-medium py-1 px-1 w-14">
                            Exc
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(([option, count]) => {
                          const inc = includeByField[key].includes(option);
                          const exc = excludeByField[key].includes(option);
                          const rowId = `${idPrefix}-${encodeURIComponent(
                            option
                          ).slice(0, 80)}`;
                          return (
                            <tr
                              key={option}
                              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                            >
                              <td className="py-1 px-2 text-slate-700 break-words">
                                <label
                                  htmlFor={`${rowId}-inc`}
                                  className="cursor-pointer"
                                >
                                  {option}{" "}
                                  <span className="text-slate-400">
                                    ({count})
                                  </span>
                                </label>
                              </td>
                              <td className="text-center py-1 px-1">
                                <input
                                  id={`${rowId}-inc`}
                                  type="checkbox"
                                  checked={inc}
                                  disabled={exc}
                                  onChange={(e) =>
                                    toggleFilter(
                                      key,
                                      option,
                                      "include",
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  aria-label={`Include ${label}: ${option}`}
                                />
                              </td>
                              <td className="text-center py-1 px-1">
                                <input
                                  id={`${rowId}-exc`}
                                  type="checkbox"
                                  checked={exc}
                                  disabled={inc}
                                  onChange={(e) =>
                                    toggleFilter(
                                      key,
                                      option,
                                      "exclude",
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                  aria-label={`Exclude ${label}: ${option}`}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <p className="text-sm text-slate-600 mb-3">
            Showing {filteredGameDetails.length} game
            {filteredGameDetails.length !== 1 ? "s" : ""}
          </p>
          <div>
            {currentGames.length === 0 ? (
              <p>
                No games match these filters, or nothing was returned from the
                server yet.
              </p>
            ) : (
              currentGames.map((game) => (
                <div
                  className="flex flex-col md:flex-row shadow border border-slate-200 bg-white my-4 rounded overflow-hidden"
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
                    <p className="text-sm text-slate-600 mb-3">
                      <span className="mr-4">
                        <strong className="text-slate-700">
                          BGG discovered:
                        </strong>{" "}
                        {formatGameDate(game.bggDiscoveredAt)}
                      </span>
                      <span>
                        <strong className="text-slate-700">Updated:</strong>{" "}
                        {formatGameDate(game.updatedAt)}
                      </span>
                    </p>
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
                        className="text-center w-full mt-4 p-4 border-2 border-slate-300 hover:bg-slate-200 rounded"
                        href={`https://boardgamegeek.com/boardgame/${game.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on BGG
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-center mt-4 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCurrentPage((prev) => Math.max(prev - 1, 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === 1}
              className="p-2 px-4 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="p-2 text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === totalPages}
              className="p-2 px-4 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewGames;
