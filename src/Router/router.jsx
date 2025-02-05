import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Header from "../InitialPage/Sidebar/Header";
import Sidebar from "../InitialPage/Sidebar/Sidebar";
import { pagesRoute, posRoutes, publicRoutes } from "./router.link";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import ThemeSettings from "../InitialPage/themeSettings";
// import CollapsedSidebar from "../InitialPage/Sidebar/collapsedSidebar";
import Loader from "../feature-module/loader/loader";
import Dashboard from "../feature-module/dashboard/Dashboard";

// import HorizontalSidebar from "../InitialPage/Sidebar/horizontalSidebar";
//import LoadingSpinner from "../InitialPage/Sidebar/LoadingSpinner";

const AllRoutes = () => {
  const data = useSelector((state) => state.toggle_header);
  // const layoutStyles = useSelector((state) => state.layoutstyledata);
  const HeaderLayout = () => (
    <div className={`main-wrapper ${data ? "header-collapse" : ""}`}>
      <Header />
      {/* {layoutStyles == "collapsed" ? (
        <CollapsedSidebar />
      ) : layoutStyles == "horizontal" ? (
        <HorizontalSidebar />
      ) : (
        <Sidebar />
      )} */}
      <Sidebar />
      <Outlet />
      <ThemeSettings />
      <Loader />
    </div>
  );

  const Authpages = () => (
    <div className={data ? "header-collapse" : ""}>
      <Outlet />
      <Loader />
      <ThemeSettings />
    </div>
  );

  const Pospages = () => (
    <div>
      <Header />
      <Outlet />
      <Loader />
      <ThemeSettings />
    </div>
  );
  

  return (
    <div>
      <Routes>
        {/* POS routes */}
        <Route path="/pos/*" element={<Pospages />}>
          {posRoutes.map((route, id) => (
            <Route 
              key={id}
              path={route.path.replace('/pos', '')} 
              element={route.element}
            />
          ))}
        </Route>

        {/* Auth pages - no /* to make it a separate route group */}
        <Route path="/auth/*" element={<Authpages />}>
          {pagesRoute.map((route, id) => (
            <Route 
              key={id}
              path={route.path.replace('/', '')}
              element={route.element}
            />
          ))}
        </Route>

        {/* Main routes - make this the last route to catch all other paths */}
        <Route path="/" element={<HeaderLayout />}>
          <Route index element={<Dashboard />} />
          {publicRoutes.map((route, id) => {
            // Skip the root path since we already have an index route
            if (route.path === "/") return null;
            
            return (
              <Route 
                key={id}
                path={route.path.replace('/', '')}
                element={route.element}
              />
            );
          })}
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </div>
  );
};

export default AllRoutes;
