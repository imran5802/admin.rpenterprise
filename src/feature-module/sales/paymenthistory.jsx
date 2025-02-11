import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import { Filter, Trash2 } from "react-feather";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import Select from "react-select";
import { CreditCard, User, Zap, Calendar } from "react-feather";
import DateRangePicker from "react-bootstrap-daterangepicker";
import Breadcrumbs from "../../core/breadcrumbs";

const PaymentHistory = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [sortField, setSortField] = useState("paymentDate"); // Set default sort field
  const [sortDirection, setSortDirection] = useState("desc"); // Set default sort direction

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  const optionsCategory = [
    { value: "Printing", label: "Printing" },
    { value: "Travel", label: "Travel" },
  ];

  const optionsCreatedBy = [
    { value: "Susan Lopez", label: "Susan Lopez" },
    { value: "Russell Belle", label: "Russell Belle" },
  ];

  const optionsPaymentMethod = [
    { value: "Paypal", label: "Paypal" },
    { value: "Stripe", label: "Stripe" },
  ];

  const initialSettings = {
    endDate: new Date("2020-08-11T12:30:00.000Z"),
    ranges: {
      "Last 30 Days": [
        new Date("2020-07-12T04:57:17.076Z"),
        new Date("2020-08-10T04:57:17.076Z"),
      ],
      "Last 7 Days": [
        new Date("2020-08-04T04:57:17.076Z"),
        new Date("2020-08-10T04:57:17.076Z"),
      ],
      "Last Month": [
        new Date("2020-06-30T18:30:00.000Z"),
        new Date("2020-07-31T18:29:59.999Z"),
      ],
      "This Month": [
        new Date("2020-07-31T18:30:00.000Z"),
        new Date("2020-08-31T18:29:59.999Z"),
      ],
      Today: [
        new Date("2020-08-10T04:57:17.076Z"),
        new Date("2020-08-10T04:57:17.076Z"),
      ],
      Yesterday: [
        new Date("2020-08-09T04:57:17.076Z"),
        new Date("2020-08-09T04:57:17.076Z"),
      ],
    },
    startDate: new Date("2020-08-04T04:57:17.076Z"), // Set "Last 7 Days" as default
    timePicker: false,
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/payments`);
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteClick = (paymentId) => {
    setSelectedPaymentId(paymentId);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/payments/${selectedPaymentId}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();

      if (data.success) {
        // Remove the deleted payment from the state
        setPayments(
          payments.filter((payment) => payment.paymentID !== selectedPaymentId)
        );
        setDeleteModal(false);
      } else {
        console.error("Failed to delete payment");
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const handleSort = (field) => {
    const newDirection =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
  };

  const getSortedPayments = () => {
    if (!sortField) return payments;

    return [...payments].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle date comparison
      if (sortField === "paymentDate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle numeric comparison
      if (sortField === "amount") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumbs
          maintitle="Income Report"
          subtitle="Manage Your Income Report"
        />
        {/* /product list */}
        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search"
                    className="form-control form-control-sm formsearch"
                  />
                  <Link to className="btn btn-searchset">
                    <i data-feather="search" className="feather-search" />
                  </Link>
                </div>
              </div>
              <div className="search-path">
                <Link
                  className={`btn btn-filter ${
                    isFilterVisible ? "setclose" : ""
                  }`}
                  id="filter_search"
                >
                  <Filter
                    className="filter-icon"
                    onClick={toggleFilterVisibility}
                  />
                  <span onClick={toggleFilterVisibility}>
                    <ImageWithBasePath
                      src="assets/img/icons/closes.svg"
                      alt="img"
                    />
                  </span>
                </Link>
              </div>
            </div>
            {/* /Filter */}
            <div
              className={`card${isFilterVisible ? " visible" : ""}`}
              id="filter_inputs"
              style={{ display: isFilterVisible ? "block" : "none" }}
            >
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-lg-2 col-sm-6 col-12">
                    <div className="input-blocks">
                      <Zap className="info-img" />
                      <Select
                        className="select"
                        options={optionsCategory}
                        placeholder="Choose Category"
                      />
                    </div>
                  </div>
                  <div className="col-lg-2 col-sm-6 col-12">
                    <div className="input-blocks">
                      <User className="info-img" />
                      <Select
                        className="select"
                        options={optionsCreatedBy}
                        placeholder="Created by"
                      />
                    </div>
                  </div>
                  <div className="col-lg-2 col-sm-6 col-12">
                    <div className="input-blocks">
                      <CreditCard className="info-img" />
                      <Select
                        className="select"
                        options={optionsPaymentMethod}
                        placeholder="Payment Method"
                      />
                    </div>
                  </div>
                  <div className="col-lg-2 col-sm-6 col-12">
                    <div className="input-blocks">
                      <div className="position-relative daterange-wraper">
                        <Calendar className="feather-14 info-img" />

                        <DateRangePicker initialSettings={initialSettings}>
                          <input
                            className="form-control col-4 input-range"
                            type="text"
                            style={{ border: "none" }}
                          />
                        </DateRangePicker>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-sm-6 col-12 ms-auto">
                    <div className="input-blocks">
                      <Link className="btn btn-filters ms-auto">
                        {" "}
                        <i
                          data-feather="search"
                          className="feather-search"
                        />{" "}
                        Search{" "}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Filter */}
            <div className="table-responsive">
              <table className="table datanew">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort("paymentDate")}
                      style={{ cursor: "pointer" }}
                    >
                      Payment Date{" "}
                      {sortField === "paymentDate" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("orderNumber")}
                      style={{ cursor: "pointer" }}
                    >
                      Order No.{" "}
                      {sortField === "orderNumber" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("customerName")}
                      style={{ cursor: "pointer" }}
                    >
                      Customer{" "}
                      {sortField === "customerName" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("paymentMethod")}
                      style={{ cursor: "pointer" }}
                    >
                      Payment Method{" "}
                      {sortField === "paymentMethod" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("amount")}
                      style={{ cursor: "pointer" }}
                    >
                      Amount{" "}
                      {sortField === "amount" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    getSortedPayments().map((payment) => (
                      <tr key={payment.paymentID}>
                        <td>
                          <Calendar size={14}></Calendar>{" "}
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td>{payment.orderNumber || "-"}</td>
                        <td>{payment.customerName}</td>
                        <td>{payment.paymentMethod}</td>
                        <td>৳ {payment.amount}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteClick(payment.paymentID)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={deleteModal} onHide={() => setDeleteModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Confirm Delete</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Are you sure you want to delete this payment?
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteConfirm}>
                  Delete
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
        {/* /product list */}
      </div>
    </div>
  );
};

export default PaymentHistory;
