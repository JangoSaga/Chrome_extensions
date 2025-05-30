import { Link } from "react-router";
import styled from "styled-components";
const StyledNav = styled.nav`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  background-color: #0073e6; /* A softer blue for better contrast */
  width: 100%;
  padding: 0.5rem 0;

  a {
    text-decoration: none;
    color: white;
    font-weight: bold;
    padding: 0.5rem 1rem;
    transition: background-color 0.3s ease, color 0.3s ease;

    &:hover {
      background-color: #005bb5;
      color: #f5f7fa;
      border-radius: 0.25rem;
    }

    &.active {
      border-bottom: 2px solid #f5f7fa;
    }
  }
`;

function Navbar() {
  return (
    <StyledNav>
      <Link to="/">Dashboard</Link>
      <Link to="/site-settings">Site Settings</Link>
      <Link to="/goals">Goals</Link>
    </StyledNav>
  );
}

export default Navbar;
