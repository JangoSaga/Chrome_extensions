import { Outlet } from "react-router";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import { GoalProgress } from "../hooks/useGoals";
const StyledAppLayout = styled.main`
  height: 30vh;
  min-width: 400px; /* Explicit width */
  min-height: 300px; /* Explicit height (max allowed: 600px) */
`;
function AppLayout() {
  return (
    <StyledAppLayout>
      <GoalProgress>
        <Header />
        <Outlet />
        <Footer />
      </GoalProgress>
    </StyledAppLayout>
  );
}

export default AppLayout;
