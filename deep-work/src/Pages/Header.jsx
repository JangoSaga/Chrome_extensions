import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="header">
      <h1>Deep Work</h1>
      <nav>
        <ul>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/site-settings">Site Settings</Link>
          </li>
          <li>
            <Link to="/goals">Goals</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
