import styled from "styled-components";

const StyledFooter = styled.footer`
  background-color: #f0f0f0;
  text-align: center;
  padding: 0.2rem;
`;
const Footer = () => (
  <StyledFooter className="footer">
    👾Created by <a href="https://github.com/JangoSaga">K.A.V</a>
  </StyledFooter>
);

export default Footer;
