import { ChevronUp, Info } from "feather-icons-react/build/IconComponents";
import ArrowLeft from "feather-icons-react/build/IconComponents/ArrowLeft";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import { all_routes } from "../../Router/all_routes";
import { useDispatch, useSelector } from "react-redux";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { setToogleHeader } from "../../core/redux/action";
import axios from "axios";

const AddEmployee = () => {
  const navigate = useNavigate();
  const route = all_routes;
  const dispatch = useDispatch();
  const data = useSelector((state) => state.toggle_header);

  const renderCollapseTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };
  const [showConfirmPassword, setConfirmPassword] = useState(false);
  const handleToggleConfirmPassword = () => {
    setConfirmPassword((prevShowPassword) => !prevShowPassword);
  };

  const designation = [
    { value: "Super Admin", label: "Super Admin" },
    { value: "Admin", label: "Admin" },
    { value: "Manager", label: "Manager" },
    { value: "Delivery Man", label: "Delivery Man" },
  ];

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    mobile: '',
    designation: '',
    loginName: '',
    loginPassword: '',
    confirmPassword: '',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      designation: selectedOption.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.mobile || !formData.designation) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.loginPassword !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3006/api/employees', {
        name: formData.name,
        address: formData.address,
        mobile: formData.mobile,
        email: formData.email,
        status: formData.status,
        designation: formData.designation,
        joinDate: formData.joinDate,
        loginName: formData.loginName || formData.email,
        loginPassword: formData.loginPassword
      });

      if (response.data.success) {
        alert('Employee added successfully');
        navigate(route.employeegrid);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Error adding employee. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(route.employeegrid);
  };

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>New Employee</h4>
                <h6>Create new Employee</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <li>
                <div className="page-btn">
                  <Link to={route.employeegrid} className="btn btn-secondary">
                    <ArrowLeft className="me-2" />
                    Back to Employee List
                  </Link>
                </div>
              </li>
              <li>
                <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                  <Link
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    id="collapse-header"
                    className={data ? "active" : ""}
                    onClick={() => {
                      dispatch(setToogleHeader(!data));
                    }}
                  >
                    <ChevronUp />
                  </Link>
                </OverlayTrigger>
              </li>
            </ul>
          </div>
          {/* /product list */}
          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-body">
                <div className="new-employee-field">
                  <div className="card-title-head">
                    <h6>
                      <span>
                        <Info className="feather-edit" />
                      </span>
                      Employee Information
                    </h6>
                  </div>
                  <div className="row">
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Display Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Address</label>
                        <input
                          type="text"
                          className="form-control"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Contact Number</label>
                        <input
                          type="text"
                          className="form-control"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Designation</label>
                        <Select
                          className="select"
                          options={designation}
                          placeholder="Choose"
                          onChange={handleSelectChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pass-info">
                    <div className="row">
                      <div className="col-lg-4 col-md-6">
                        <div className="input-blocks mb-md-0 mb-sm-3">
                          <label>Password</label>
                          <div className="pass-group">
                            <input
                              type={showPassword ? "text" : "password"}
                              className="pass-input"
                              placeholder="Enter your password"
                              name="loginPassword"
                              value={formData.loginPassword}
                              onChange={handleInputChange}
                              required
                            />
                            <span
                              className={`fas toggle-password ${
                                showPassword ? "fa-eye" : "fa-eye-slash"
                              }`}
                              onClick={handleTogglePassword}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="input-blocks mb-0">
                          <label>Confirm Password</label>
                          <div className="pass-group">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              className="pass-input"
                              placeholder="Enter your password"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              required
                            />
                            <span
                              className={`fas toggle-password ${
                                showConfirmPassword ? "fa-eye" : "fa-eye-slash"
                              }`}
                              onClick={handleToggleConfirmPassword}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-end mb-3">
              <button type="button" className="btn btn-cancel me-2" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-submit">
                Save Employee
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
