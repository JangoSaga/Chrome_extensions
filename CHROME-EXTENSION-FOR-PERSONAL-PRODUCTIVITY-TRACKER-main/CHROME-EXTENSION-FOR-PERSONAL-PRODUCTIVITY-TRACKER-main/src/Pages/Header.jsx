import styled from "styled-components";

const StyledHeader = styled.header`
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  padding: 1rem;
  width: 100%;
  font-size: 2rem;
  font-family: "Pixelify Sans", serif;
  font-weight: 400;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  /* margin: 0.2rem; */
`;

const Header = () => {
  return (
    <StyledHeader>
      <h1>👾Focus Work</h1>
    </StyledHeader>
  );
};

export default Header;
