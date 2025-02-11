import React, { useEffect, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { all_routes } from "../../Router/all_routes";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import {
  Edit,
  Grid,
  List,
  MoreVertical,
  PlusCircle,
  RotateCcw,
  Trash2,
} from "feather-icons-react/build/IconComponents";
import { setToogleHeader } from "../../core/redux/action";
import { ChevronUp, Users } from "react-feather";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

const EmployeesGrid = () => {
  const route = all_routes;
  const dispatch = useDispatch();
  const data = useSelector((state) => state.toggle_header);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees`);
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const renderTooltip = (props) => (
    <Tooltip id="pdf-tooltip" {...props}>
      Pdf
    </Tooltip>
  );
  const renderExcelTooltip = (props) => (
    <Tooltip id="excel-tooltip" {...props}>
      Excel
    </Tooltip>
  );
  const renderPrinterTooltip = (props) => (
    <Tooltip id="printer-tooltip" {...props}>
      Printer
    </Tooltip>
  );
  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );
  const renderCollapseTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Collapse
    </Tooltip>
  );
  const MySwal = withReactContent(Swal);
  const showConfirmationAlert = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      showCancelButton: true,
      confirmButtonColor: "#00ff00",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#ff0000",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        MySwal.fire({
          title: "Deleted!",
          text: "Your file has been deleted.",
          className: "btn btn-success",
          confirmButtonText: "OK",
          customClass: {
            confirmButton: "btn btn-success",
          },
        });
      } else {
        MySwal.close();
      }
    });
  };

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Employees</h4>
                <h6>Manage your employees</h6>
              </div>
            </div>
            {/* Move action buttons to far right */}
            <div className="d-flex align-items-center">
              <div className="page-btn me-2">
                <Link to={route.addemployee} className="btn btn-added">
                  <PlusCircle className="me-2" />
                  Add New Employee
                </Link>
              </div>
              <ul className="table-top-head">
                <li>
                  <OverlayTrigger placement="top" overlay={renderTooltip}>
                    <Link>
                      <ImageWithBasePath
                        src="assets/img/icons/pdf.svg"
                        alt="img"
                      />
                    </Link>
                  </OverlayTrigger>
                </li>
                <li>
                  <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
                    <Link data-bs-toggle="tooltip" data-bs-placement="top">
                      <ImageWithBasePath
                        src="assets/img/icons/excel.svg"
                        alt="img"
                      />
                    </Link>
                  </OverlayTrigger>
                </li>
                <li>
                  <OverlayTrigger
                    placement="top"
                    overlay={renderPrinterTooltip}
                  >
                    <Link data-bs-toggle="tooltip" data-bs-placement="top">
                      <i data-feather="printer" className="feather-printer" />
                    </Link>
                  </OverlayTrigger>
                </li>
                <li>
                  <OverlayTrigger
                    placement="top"
                    overlay={renderRefreshTooltip}
                  >
                    <Link data-bs-toggle="tooltip" data-bs-placement="top">
                      <RotateCcw />
                    </Link>
                  </OverlayTrigger>
                </li>
                <li>
                  <OverlayTrigger
                    placement="top"
                    overlay={renderCollapseTooltip}
                  >
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
          </div>
          {/* /product list */}
          <div className="card">
            <div className="card-body pb-0">
              <div className="table-top table-top-two table-top-new">
                <div className="search-set mb-0">
                  <div className="total-employees">
                    <h6>
                      <Users />
                      Total Employees <span>{employees.length}</span>
                    </h6>
                  </div>
                  <div className="search-input">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search employee..."
                    />
                  </div>
                </div>
                <div className="search-path d-flex align-items-center search-path-new">
                  <div className="d-flex">
                    <Link to={route.employeelist} className="btn-list">
                      <List />
                    </Link>
                    <Link to={route.employeegrid} className="btn-grid active">
                      <Grid />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /product list */}
          <div className="employee-grid-widget">
            <div className="row">
              {employees.map((employee) => (
                <div
                  key={employee.empId}
                  className="col-xxl-2 col-xl-3 col-lg-4 col-md-6"
                >
                  <div className="employee-grid-profile">
                    <div className="profile-head position-relative">
                      <div className="profile-head-action position-absolute top-0 end-0 me-2">
                        <div className="dropdown profile-action">
                          <Link
                            to="#"
                            className="action-icon dropdown-toggle"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <MoreVertical />
                          </Link>
                          <ul className="dropdown-menu">
                            <li>
                              <Link
                                to={route.editemployee}
                                className="dropdown-item"
                              >
                                <Edit className="info-img" />
                                Edit
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item confirm-text mb-0"
                                onClick={showConfirmationAlert}
                              >
                                <Trash2 className="info-img" />
                                Delete
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="profile-info text-center">
                      <div
                        className={`profile-pic mx-auto ${
                          employee.status === "Active" ? "active-profile" : ""
                        }`}
                      >
                        <img
                          src={
                            employee.imageUrl ||
                            "assets/img/avatar/avatar-16.png"
                          }
                          alt={employee.name}
                        />
                      </div>
                      <h5>EMP ID : {employee.empId}</h5>
                      <h4>{employee.name}</h4>
                      <span>{employee.designation}</span>
                    </div>
                    <ul className="department">
                      <li>
                        Joined
                        <span>
                          {new Date(employee.joinDate).toLocaleDateString()}
                        </span>
                      </li>
                      <li>
                        Status
                        <span
                          className={`${
                            employee.status === "Active"
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeesGrid;
