import { useBggGamesContext } from "../../context/BggGamesContext";
import { TGame } from "../../types/types";
import Game from "../Game/Game";

const GamesList = () => {
  const { collection, loading, error } = useBggGamesContext();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {collection?.map((game: TGame) => (
        <div className="col-span-1">
          <Game {...game} key={game.bggId} />
        </div>
      ))}
    </div>
  );
};

export default GamesList;
