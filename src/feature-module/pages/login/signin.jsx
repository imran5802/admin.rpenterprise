import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import ImageWithBasePath from "../../../core/img/imagewithbasebath";
import { Link } from "react-router-dom";
import { all_routes } from "../../../Router/all_routes";
import { authService } from "../../../services/authService";
import { setAuth } from "../../../core/redux/action";

const Signin = () => {
  const route = all_routes;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    loginName: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const employee = authService.getCurrentEmployee();
    if (employee) {
      dispatch(setAuth({ employee }));
      navigate(route.dashboard);
    }
  }, [dispatch, navigate, route.dashboard]);

  const from = location.state?.from?.pathname || "/";

  const validateForm = () => {
    if (!formData.loginName.trim()) {
      setError('Login name is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await authService.login(formData.loginName, formData.password);
      if (response.success) {
        dispatch(setAuth(response.employee));
        
        // Check employee designation and redirect accordingly
        if (response.employee.designation === 'Delivery Man') {
          navigate(route.deliverydashboard, { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError(''); // Clear error on input change
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper bg-img">
          <div className="login-content">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="login-userset">
                <div className="login-logo logo-normal">
                  <ImageWithBasePath src="assets/img/logo.png" alt="img" />
                </div>
                <Link to={route.dashboard} className="login-logo logo-white">
                  <ImageWithBasePath src="assets/img/logo-white.png" alt="while logo" />
                </Link>
                <div className="login-userheading">
                  <h3>Sign In</h3>
                  <h4>
                    Access the RP Enterprise Admin panel using your name and passcode.
                  </h4>
                </div>
                <div className="form-login mb-3">
                  <label className="form-label">Login Name</label>
                  <div className="form-addons">
                    <input
                      type="text"
                      className="form-control"
                      name="loginName"
                      value={formData.loginName}
                      onChange={handleChange}
                      required
                    />
                    <ImageWithBasePath
                      src="assets/img/icons/user-icon.svg"
                      alt="img"
                    />
                  </div>
                </div>
                <div className="form-login mb-3">
                  <label className="form-label">Password</label>
                  <div className="pass-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="pass-input form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <span 
                      className={`fas toggle-password fa-eye${showPassword ? '' : '-slash'}`}
                      onClick={togglePasswordVisibility}
                    />
                  </div>
                </div>
                <div className="form-login authentication-check">
                  <div className="row">
                    <div className="col-12 d-flex align-items-center justify-content-between">
                      <div className="custom-control custom-checkbox">
                        <label className="checkboxs ps-4 mb-0 pb-0 line-height-1">
                          <input type="checkbox" className="form-control" />
                          <span className="checkmarks" />
                          Remember me
                        </label>
                      </div>
                      {/* <div className="text-end">
                        <Link className="forgot-link" to="/auth/forgot-password">
                          Forgot Password?
                        </Link>
                      </div> */}
                    </div>
                  </div>
                </div>
                <div className="form-login">
                  <button 
                    type="submit" 
                    className="btn btn-login"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>
                <div className="my-2 d-flex justify-content-center align-items-center copyright-text">
                    <p>Copyright © {new Date().getFullYear()} RP Enterprise. All rights reserved</p>
                  </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
