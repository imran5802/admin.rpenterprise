import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
// import ImageWithBasePath from "../../core/img/imagewithbasebath";
// import { Link } from "react-router-dom";
import { setAuth } from "../../core/redux/action";

const Profile = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    designation: '',
    loginName: '',
    loginPassword: ''
  });

  useEffect(() => {
    if (auth) {
      setFormData({
        name: auth.name || '',
        email: auth.email || '',
        mobile: auth.mobile || '',
        address: auth.address || '',
        designation: auth.designation || '',
        loginName: auth.loginName || '',
        loginPassword: auth.loginPassword || ''
      });
    }
  }, [auth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/${auth.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        dispatch(setAuth({ ...auth, ...formData }));
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Update failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4>Profile</h4>
            <h6>Update Your Profile</h6>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="profile-set">
              <div className="profile-head"></div>
              <div className="profile-top">
                <div className="profile-content">
                  <div className="profile-contentimg">
                    <img
                      src={auth?.imageUrl || "assets/img/profiles/avatar-01.jpg"}
                      alt="Profile"
                      id="blah"
                    />
                  </div>
                  <div className="profile-contentname">
                    <h2>{auth?.name}</h2>
                    <h4>Update Your Profile Details</h4>
                  </div>
                </div>
              </div>
            </div>
            {message.text && (
              <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-lg-6 col-sm-12">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="form-group">
                    <label>Mobile</label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="form-group">
                    <label>Login Name</label>
                    <input
                      type="text"
                      name="loginName"
                      value={formData.loginName}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="loginPassword"
                      value={formData.loginPassword}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-12 my-3">
                  <button 
                    type="submit" 
                    className="btn btn-submit me-2"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                  <button type="button" className="btn btn-cancel">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
