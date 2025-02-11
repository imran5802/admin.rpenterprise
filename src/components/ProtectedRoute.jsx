import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { authService } from '../services/authService';
import { setAuth } from '../core/redux/action';
import { all_routes } from '../Router/all_routes';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = authService.isAuthenticated();
  const employee = isAuthenticated ? authService.getCurrentEmployee() : null;
  
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(setAuth(employee));
    }
  }, [dispatch, isAuthenticated, employee]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // Handle delivery man access restrictions
  if (employee?.designation === 'Delivery Man' && 
      location.pathname !== all_routes.deliverydashboard) {
    return <Navigate to={all_routes.deliverydashboard} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default ProtectedRoute;
