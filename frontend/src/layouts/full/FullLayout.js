import React, { useState } from "react";
import { styled, Container, Box } from '@mui/material';
import { Outlet, useLocation } from "react-router";

const MainWrapper = styled('div')(() => ({
  display: 'flex',
 // minHeight: '100vh',
  width: '100%',
}));

const PageWrapper = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
  flexDirection: 'column',
  zIndex: 1,
  paddingBottom: '30px',
  backgroundColor: 'transparent',
}));

const FullLayout = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

  return (
    <>
      {/* ------------------------------------------- */}
      {/* Topbar */}
      {/* ------------------------------------------- */}
      {/* <Topbar /> */}
      <MainWrapper
        className='mainwrapper'
      >

        {/* ------------------------------------------- */}
        {/* Sidebar */}
        {/* ------------------------------------------- */}
        {/* <Sidebar isSidebarOpen={isSidebarOpen}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onSidebarClose={() => setMobileSidebarOpen(false)} /> */}


        {/* ------------------------------------------- */}
        {/* Main Wrapper */}
        {/* ------------------------------------------- */}
        <PageWrapper
          className="page-wrapper"
        >
          {/* ------------------------------------------- */}
          {/* Header */}
          {/* ------------------------------------------- */}
          {/* <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} toggleMobileSidebar={() => setMobileSidebarOpen(true)} /> */}
          {/* ------------------------------------------- */}
          {/* PageContent */}
          {/* ------------------------------------------- */}
          {isDashboard ? (
            // Full screen layout for ChatPage
            <Box sx={{ 
              height: '100vh',
              width: '100vw',
              overflow: 'hidden'
            }}>
              <Outlet />
            </Box>
          ) : (
            // Regular container layout for other pages
            <Container sx={{
              paddingTop: "20px",
              maxWidth: '1200px',
            }}>
              <Box sx={{ minHeight: 'calc(100vh - 55px)' }}>
                <Outlet />
              </Box>
            </Container>
          )}
          {/* <Footer /> */}
        </PageWrapper>
      </MainWrapper>
    </>
  );
};

export default FullLayout;
