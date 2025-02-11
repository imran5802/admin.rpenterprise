import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Header from "../InitialPage/Sidebar/Header";
import Sidebar from "../InitialPage/Sidebar/Sidebar";
import { pagesRoute, publicRoutes } from "./router.link"; // Remove posRoutes if unused
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import ThemeSettings from "../InitialPage/themeSettings";
import Loader from "../feature-module/loader/loader";
import Dashboard from "../feature-module/dashboard/Dashboard";
import ProtectedRoute from '../components/ProtectedRoute';
import Signin from '../feature-module/pages/login/signin'; // Add Signin import

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

  // Remove or comment out Pospages if unused
  /* const Pospages = () => (
    <div>
      <Header />
      <Outlet />
      <Loader />
      <ThemeSettings />
    </div>
  ); */

  return (
    <div>
      <Routes>
        {/* Move auth routes first for proper handling */}
        <Route path="/auth/*" element={<Authpages />}>
          <Route path="signin" element={<Signin />} />
          {/* Other auth routes */}
          {pagesRoute.map((route, id) => (
            <Route 
              key={id}
              path={route.path.replace('/', '')}
              element={route.element}
            />
          ))}
        </Route>

        {/* Protected routes */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <HeaderLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          {publicRoutes.map((route, id) => {
            if (route.path === "/") return null;
            return (
              <Route 
                key={id}
                path={route.path.replace('/', '')}
                element={route.element}
              />
            );
          })}
        </Route>

        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/auth/signin" replace />} />
      </Routes>
    </div>
  );
};

export default AllRoutes;
