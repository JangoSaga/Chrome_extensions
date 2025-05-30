import { Outlet } from "react-router";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import Navbar from "../components/Navbar";

// const ExtensionContainer = styled.div`
//   width: 350px;
//   height: 500px;
//   display: flex;
//   flex-direction: column;
//   background-color: #f5f7fa;
//   position: relative;
// `;
const ExtensionContainer = styled.div`
  min-width: 400px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  border-radius: 0.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
`;

const HeaderWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f5f7fa;
  padding: 0.5rem;
`;

const NavWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  background-color: #f5f7fa;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.75rem;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #e5e5e5;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #b0b0b0;
    border-radius: 4px;
    transition: background-color 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #909090;
  }
`;

const StyledMain = styled.main`
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  margin-bottom: 0.75rem;
`;

const FooterWrapper = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 10;
  background-color: #f5f7fa;
  border-top: 1px solid #e5e7eb;
`;

function AppLayout() {
  return (
    <ExtensionContainer>
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>

      <NavWrapper>
        <Navbar />
      </NavWrapper>

      <ContentWrapper>
        <StyledMain>
          <Outlet />
        </StyledMain>
      </ContentWrapper>

      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    </ExtensionContainer>
  );
}

export default AppLayout;
