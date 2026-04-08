/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { TGame } from "../types/types";
import { XMLParser } from "fast-xml-parser";

type BggGamesContextProps = {
  children: ReactNode;
};

type BggGamesContextValue = {
  collection: TGame[] | null;
  setCollection: React.Dispatch<React.SetStateAction<TGame[] | null>>;
  allGames: TGame[] | null;
  gameWithSmallestPlaytime: TGame | null;
  gameWithLargestPlaytime: TGame | null;
  loading: boolean;
  error: string | null;
};

const BggGamesContext = createContext<BggGamesContextValue | undefined>(
  undefined
);

type RawGame = Record<string, unknown>;

function xmlText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "object" && "#text" in (node as object)) {
    const t = (node as { "#text"?: unknown })["#text"];
    return t != null ? String(t) : "";
  }
  return "";
}

function attr(obj: unknown, key: string): string {
  if (obj == null || typeof obj !== "object") return "";
  const v = (obj as Record<string, unknown>)[key];
  return v != null ? String(v) : "";
}

/** BGG xmlapi collection: `item` is one object or an array; empty collection has no `item`. */
function normalizeCollectionItems(data: unknown): RawGame[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const items = root.items ?? root.Items;
  if (!items || typeof items !== "object") return [];
  const item = (items as Record<string, unknown>).item;
  if (item == null) return [];
  return Array.isArray(item) ? (item as RawGame[]) : [item as RawGame];
}

function apiErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const msg = root.message ?? root.Message;
  if (msg == null) return null;
  if (typeof msg === "string") return msg;
  return xmlText(msg) || null;
}

function formatGames(games: RawGame[]): TGame[] {
  return games.map((game) => {
    const stats = game.stats;
    const status = game.status;
    const nameNode = game.name;
    const np = game.numplays;

    const nameStr =
      xmlText(nameNode) ||
      (typeof nameNode === "string" ? nameNode : "") ||
      attr(nameNode as object, "@_value");

    return {
      bggId: attr(game, "@_objectid"),
      name: nameStr,
      yearpublished:
        xmlText(game.yearpublished) || String(game.yearpublished ?? ""),
      image: xmlText(game.image) || String(game.image ?? ""),
      thumbnail: xmlText(game.thumbnail) || String(game.thumbnail ?? ""),
      minplayers: parseInt(attr(stats, "@_minplayers"), 10) || 0,
      maxplayers: parseInt(attr(stats, "@_maxplayers"), 10) || 0,
      minplaytime: parseInt(attr(stats, "@_minplaytime"), 10) || 0,
      maxplaytime: parseInt(attr(stats, "@_maxplaytime"), 10) || 0,
      playingtime: parseInt(attr(stats, "@_playingtime"), 10) || 0,
      numplays:
        parseInt(xmlText(np) || (typeof np === "string" ? np : "0"), 10) || 0,
      comment: xmlText(game.comment) || String(game.comment ?? ""),
      fortrade: parseInt(attr(status, "@_fortrade"), 10) || 0,
    };
  });
}

const BggGamesProvider: React.FC<BggGamesContextProps> = ({ children }) => {
  const [collection, setCollection] = useState<TGame[] | null>(null);
  const [allGames, setAllGames] = useState<TGame[] | null>(null);
  const [, setFormattedGames] = useState<TGame[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const base = (import.meta.env.VITE_API_URL ?? "/api").replace(
          /\/$/,
          ""
        );
        const response = await fetch(
          `${base}/bgg/collection/boardgaymesjames?own=1&excludesubtype=boardgameexpansion`
        );
        if (!response.ok) {
          setError(
            `Could not load collection (HTTP ${response.status}). Ensure the API server has a valid BGG_API_KEY.`
          );
          setAllGames([]);
          setFormattedGames([]);
          setLoading(false);
          return;
        }
        const text = await response.text();
        const parser = new XMLParser({
          htmlEntities: true,
          ignoreAttributes: false,
          attributeNamePrefix: "@_",
          textNodeName: "#text",
        });
        const data = parser.parse(text);

        const errMsg = apiErrorMessage(data);
        if (errMsg) {
          setError(errMsg);
          setAllGames([]);
          setFormattedGames([]);
          setLoading(false);
          return;
        }

        const rawItems = normalizeCollectionItems(data);
        if (rawItems.length === 0) {
          setError(null);
          setAllGames([]);
          setFormattedGames([]);
          setLoading(false);
          return;
        }

        const formatted = formatGames(rawItems);
        setFormattedGames(formatted);
        setAllGames(formatted);
        setError(null);
        setLoading(false);
      } catch {
        setError("Failed to fetch games");
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const [gameWithSmallestPlaytime, setGameWithSmallestPlaytime] =
    useState<TGame | null>(null);

  const [gameWithLargestPlaytime, setGameWithLargestPlaytime] =
    useState<TGame | null>(null);

  useEffect(() => {
    if (allGames && allGames.length > 0) {
      const minGame = allGames.reduce(
        (min, current) =>
          current.playingtime < min.playingtime ? current : min,
        allGames[0]
      );
      setGameWithSmallestPlaytime(minGame);

      const maxGame = allGames.reduce(
        (max, current) =>
          current.playingtime > max.playingtime ? current : max,
        allGames[0]
      );
      setGameWithLargestPlaytime(maxGame);
    } else {
      setGameWithSmallestPlaytime(null);
      setGameWithLargestPlaytime(null);
    }
  }, [allGames]);

  const value: BggGamesContextValue = {
    collection,
    setCollection,
    allGames,
    gameWithSmallestPlaytime,
    gameWithLargestPlaytime,
    loading,
    error,
  };

  return (
    <BggGamesContext.Provider value={value}>
      {children}
    </BggGamesContext.Provider>
  );
};

const useBggGamesContext = () => {
  const context = useContext(BggGamesContext);
  if (!context) {
    throw new Error(
      "useBggGamesContext must be used within a BggGamesProvider"
    );
  }
  return context;
};

export { BggGamesProvider, useBggGamesContext };
