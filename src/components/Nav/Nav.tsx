import { Link } from "react-router-dom";

const Nav = () => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <h1 className="text-4xl leading-[inherit]">James BGG Stats</h1>
      <ul className=" flex">
        <li>
          <Link to="/" className="flex p-4 hover:bg-slate-300 rounded-xl">
            Home
          </Link>
        </li>
        <li>
          <Link to="/games" className="flex p-4 hover:bg-slate-300 rounded-xl">
            Games
          </Link>
        </li>
        <li>
          <Link
            to="/new-games"
            className="flex p-4 hover:bg-slate-300 rounded-xl"
          >
            2026 New Games
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Nav;
