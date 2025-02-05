import React, { useState, useEffect } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import {
  ChevronUp,
  RotateCcw,
  StopCircle,
  Map,
} from "feather-icons-react/build/IconComponents";
import { setToogleHeader } from "../../core/redux/action";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { DatePicker } from "antd";
import Swal from "sweetalert2";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SalesList = () => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const data = useSelector((state) => state.toggle_header);
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({
    value: "all",
    label: "All",
  });
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState({
    value: "all",
    label: "All",
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch("http://localhost:3006/api/sales");
      const data = await response.json();
      if (data.success) {
        setSales(data.sales);
        setFilteredSales(data.sales);
      } else {
        setError("Failed to fetch sales data");
      }
    } catch (err) {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterSales();
  }, [searchTerm, selectedStatus, selectedPaymentStatus, sales]);

  const filterSales = () => {
    let filtered = [...sales];

    // Filter by order status
    if (selectedStatus?.value && selectedStatus.value !== "all") {
      filtered = filtered.filter(
        (sale) => sale.orderStatus === selectedStatus.value
      );
    }

    // Filter by payment status
    if (selectedPaymentStatus?.value && selectedPaymentStatus.value !== "all") {
      filtered = filtered.filter(
        (sale) => sale.paymentStatus === selectedPaymentStatus.value
      );
    }

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((sale) => {
        const searchableFields = [
          sale.customerName,
          sale.customerPhone,
          sale.customerEmail,
          sale.orderNumber,
          sale.shippingAddress,
        ];
        return searchableFields.some((field) =>
          field?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredSales(filtered);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

const handleStatusUpdate = async (orderId, newStatus) => {
    if (newStatus === "Cancelled") {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to cancel this order?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, cancel it!",
            cancelButtonText: "No, keep it",
        });

        if (!result.isConfirmed) {
            return;
        }
    }

    try {
        const response = await fetch(
            `http://localhost:3006/api/sales/${orderId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            }
        );
        const data = await response.json();
        if (data.success) {
            fetchSales();
        }
    } catch (err) {
        console.error("Error updating status:", err);
    }
};

  const handleReceivePayment = async (orderId, formData) => {
    try {
      const response = await fetch(
        `http://localhost:3006/api/sales/${orderId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();
      if (data.success) {
        Swal.fire({
          title: "Success!",
          text: "Payment has been recorded successfully.",
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            handleModalClose(); // Use the updated modal close handler
            fetchSales();
          }
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: data.message || "Failed to record payment.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while processing the payment.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  // Add click handler for Receive Payment button
  const handleReceivePaymentClick = (orderId) => {
    if (orderId) {
      const orderDetails = sales.find((sale) => sale.orderID === orderId);
      setSelectedOrderDetails(orderDetails);
      setSelectedOrder(orderId);
      setShowModal(true);
    }
  };

  // Add modal close handler
  const handleModalClose = () => {
    setShowModal(false);
    // Remove modal backdrop and modal-open class
    document.body.classList.remove("modal-open");
    document.body.style.overflow = ""; // Remove overflow style
    document.body.style.paddingRight = ""; // Remove paddingRight style if any
    const backdrop = document.querySelector(".modal-backdrop");
    if (backdrop) {
      backdrop.remove();
    }
  };

  // Add click handler for Details button
  const handleDetailsClick = (orderId) => {
    const orderDetails = sales.find((sale) => sale.orderID === orderId);
    setSelectedOrderDetails(orderDetails);
  };

  const handleStatusChange = (selectedOption) => {
    setSelectedStatus(selectedOption);
  };

  const handlePaymentStatusChange = (selectedOption) => {
    setSelectedPaymentStatus(selectedOption);
  };

  // Keep only the necessary select options
  const statusOptions = [
    { value: "Confirmed", label: "Confirmed" },
    { value: "Processing", label: "Processing" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const statusOptions2 = [
    { value: "all", label: "All" },
    { value: "Confirmed", label: "Confirmed" },
    { value: "Processing", label: "Processing" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const paymentStatusOptions = [
    { value: "all", label: "All" },
    { value: "Paid", label: "Paid" },
    { value: "Unpaid", label: "Unpaid" },
    { value: "Partial", label: "Partial" },
  ];

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

  useEffect(() => {
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = ""; // Remove overflow style
      document.body.style.paddingRight = ""; // Remove paddingRight style if any
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) {
        backdrop.remove();
      }
    };
  }, []);

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Sales List</h4>
                <h6>Manage Your Sales</h6>
              </div>
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
                <OverlayTrigger placement="top" overlay={renderPrinterTooltip}>
                  <Link data-bs-toggle="tooltip" data-bs-placement="top">
                    <i data-feather="printer" className="feather-printer" />
                  </Link>
                </OverlayTrigger>
              </li>
              <li>
                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                  <Link data-bs-toggle="tooltip" data-bs-placement="top">
                    <RotateCcw />
                  </Link>
                </OverlayTrigger>
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
          <div className="card table-list-card">
            <div className="card-body">
              <div className="table-top">
                <div className="search-set">
                  <div className="search-input">
                    <input
                      type="text"
                      placeholder="Search"
                      className="form-control form-control-sm formsearch"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                    <Link to className="btn btn-searchset">
                      <i data-feather="search" className="feather-search" />
                    </Link>
                  </div>
                </div>
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "15px" }}
                >
                  <div
                    className="d-flex align-items-center"
                    style={{ width: "230px" }}
                  >
                    <label className="me-2 mb-0">Status:</label>
                    <div className="form-sort flex-grow-1">
                      <StopCircle className="info-img" />
                      <Select
                        className="select"
                        options={statusOptions2}
                        placeholder="Order Status"
                        onChange={handleStatusChange}
                        value={selectedStatus}
                      />
                    </div>
                  </div>
                  <div
                    className="d-flex align-items-center"
                    style={{ width: "280px" }}
                  >
                    <label className="me-2 mb-0">Payment:</label>
                    <div className="form-sort flex-grow-1">
                      <StopCircle className="info-img" />
                      <Select
                        className="select"
                        options={paymentStatusOptions}
                        placeholder="Payment Status"
                        onChange={handlePaymentStatusChange}
                        value={selectedPaymentStatus}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* /Filter */}
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Info</th>
                      <th>Date</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Payment Status</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7">Loading...</td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="7">{error}</td>
                      </tr>
                    ) : (
                      filteredSales.map((sale) => (
                        <tr key={sale.orderID}>
                          <td>
                            <p>{sale.orderNumber}</p>
                            <Button
                              className="btn-sm btn-primary"
                              data-bs-toggle="modal"
                              data-bs-target="#sales-details-new"
                              onClick={() => handleDetailsClick(sale.orderID)}
                            >
                              <i className="fa-solid fa-circle-info me-1"></i>{" "}
                              Details
                            </Button>
                          </td>
                          <td>
                            <div className="customer-info">
                              <p className="mb-1">
                                <strong>{sale.customerName}</strong>
                              </p>
                              <p className="mb-1 text-muted small">
                                <i className="far fa-envelope me-1"></i>
                                {sale.customerEmail}
                              </p>
                              <p className="mb-1 text-muted small">
                                <i className="fas fa-phone me-1"></i>
                                {sale.customerPhone}
                              </p>
                              <p className="mb-1 text-muted small">
                                <i className="fas fa-map-marker-alt me-1"></i>
                                {sale.shippingAddress}
                                {sale.latitude && sale.longitude && (
                                  <a
                                    href={`https://www.google.com/maps?q=${sale.latitude},${sale.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary ms-2"
                                    title={`Plus Code: ${sale.plusCode}`}
                                  >
                                    <Map size={14} />
                                  </a>
                                )}
                              </p>
                            </div>
                          </td>
                          <td>{formatDate(sale.orderDate)}</td>
                          <td>
                            <div>
                              <p className="mb-0">
                                ৳{parseFloat(sale.totalAmount).toFixed(2)}
                              </p>
                              <small className="text-muted">
                                {sale.paymentMethod}
                              </small>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                sale.orderStatus === "Completed"
                                  ? "badge-success"
                                  : sale.orderStatus === "Confirmed"
                                  ? "badge-warning"
                                  : sale.orderStatus === "Processing"
                                  ? "badge-info"
                                  : "badge-danger"
                              }`}
                            >
                              {sale.orderStatus}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                sale.paymentStatus === "Paid"
                                  ? "badge-success"
                                  : "badge-danger"
                              }`}
                            >
                              {sale.orderStatus === "Cancelled" ? "Cancelled" : sale.paymentStatus}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="dropdown">
                              <button
                                className="btn btn-secondary dropdown-toggle"
                                type="button"
                                id={`dropdown-${sale.orderID}`}
                                data-bs-toggle="dropdown"
                              >
                                Actions
                              </button>
                              <ul className="dropdown-menu">
                                {statusOptions.map((option) => (
                                  <li key={option.value}>
                                    <button
                                      className="dropdown-item"
                                      onClick={() =>
                                        handleStatusUpdate(
                                          sale.orderID,
                                          option.value
                                        )
                                      }
                                      disabled={
                                        sale.orderStatus === option.value
                                      }
                                    >
                                      Mark as {option.label}
                                    </button>
                                  </li>
                                ))}
                                <li>
                                  <hr className="dropdown-divider" />
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => {
                                      if (sale.paymentStatus !== "Paid") {
                                        handleReceivePaymentClick(sale.orderID);
                                      }
                                    }}
                                    data-bs-toggle="modal"
                                    data-bs-target="#createpayment"
                                    disabled={sale.paymentStatus === "Paid" || sale.orderStatus === "Cancelled"}
                                  >
                                    Receive Payment
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
      </div>
      <>
        {/* details popup */}
        <div className="modal fade" id="sales-details-new">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="page-wrapper details-blk">
                <div className="content p-0">
                  <div className="page-header p-4 mb-0">
                    <div className="add-item d-flex">
                      <div className="page-title modal-datail">
                        <h4>
                          Sales Detail : {selectedOrderDetails?.orderNumber}
                        </h4>
                      </div>
                    </div>
                    <ul className="table-top-head">
                      <li>
                        <Link
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Pdf"
                        >
                          <i
                            data-feather="edit"
                            className="action-edit sales-action"
                          />
                        </Link>
                      </li>
                      <li>
                        <Link
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Pdf"
                        >
                          <ImageWithBasePath
                            src="assets/img/icons/pdf.svg"
                            alt="img"
                          />
                        </Link>
                      </li>
                      <li>
                        <Link
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Excel"
                        >
                          <ImageWithBasePath
                            src="assets/img/icons/excel.svg"
                            alt="img"
                          />
                        </Link>
                      </li>
                      <li>
                        <Link
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Print"
                        >
                          <i
                            data-feather="printer"
                            className="feather-rotate-ccw"
                          />
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="card mb-0">
                    <div className="card-body">
                      <form>
                        <div className="invoice-box table-height">
                          <div className="sales-details-items">
                            <div className="details-item me-4">
                              <h6>Customer Info</h6>
                              <p>
                                {selectedOrderDetails?.customerName}
                                <br />
                                {selectedOrderDetails?.customerEmail}
                                <br />
                                {selectedOrderDetails?.customerPhone}
                                <br />
                                {selectedOrderDetails?.shippingAddress}
                              </p>
                            </div>
                            <div className="details-item">
                              <h6>Invoice Info</h6>
                              <p>
                                <strong>Reference:</strong>{" "}
                                {selectedOrderDetails?.orderNumber}
                                <br />
                                <strong>Payment Status:</strong>{" "}
                                {selectedOrderDetails?.paymentStatus}
                                <br />
                                <strong>Status:</strong>{" "}
                                {selectedOrderDetails?.orderStatus}
                              </p>
                            </div>
                          </div>
                          <h5 className="order-text">Order Summary</h5>
                          <div className="table-responsive no-pagination">
                            <table className="table datanew">
                              <thead>
                                <tr>
                                  <th width="55%">Product</th>
                                  <th width="10%" className="text-center">
                                    Qty
                                  </th>
                                  <th width="17%" className="text-end">
                                    Unit Cost (৳)
                                  </th>
                                  <th width="18%" className="text-end">
                                    Total Cost (৳)
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedOrderDetails?.products?.map(
                                  (product) => (
                                    <tr key={product.productID}>
                                      <td>
                                        {product.productEnName} (
                                        {product.productBnName})
                                      </td>
                                      <td className="text-center">
                                        {product.quantity}
                                      </td>
                                      <td className="text-end">
                                        {product.price}
                                      </td>
                                      <td className="text-end">
                                        {product.totalCost}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="row">
                          <div className="row">
                            <div className="col-lg-6 ms-auto me-0 mr-0 pe-0">
                              <div className="total-order max-widthauto m-auto mb-4">
                                <ul>
                                  <li key={1}>
                                    <h4>Memo Total</h4>
                                    <h5 className="text-end pe-0">
                                      ৳ {selectedOrderDetails?.totalAmount}
                                    </h5>
                                  </li>
                                  <li key={2}>
                                    <h4>Discount</h4>
                                    <h5 className="text-end pe-0">
                                      ৳ {selectedOrderDetails?.discountAmount}
                                    </h5>
                                  </li>
                                  <li key={3}>
                                    <h4>Grand Total</h4>
                                    <h5 className="text-end pe-0">
                                      ৳{" "}
                                      {selectedOrderDetails?.totalAmount -
                                        selectedOrderDetails?.discountAmount}
                                    </h5>
                                  </li>
                                  <li key={4}>
                                    <h4>Paid</h4>
                                    <h5 className="text-end pe-0">
                                      ৳ {selectedOrderDetails?.paidAmount}
                                    </h5>
                                  </li>
                                  <li key={5}>
                                    <h4>Due</h4>
                                    <h5 className="text-end pe-0">
                                      ৳ {selectedOrderDetails?.dueAmount}
                                    </h5>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /details popup */}
        {/* Create payment Modal */}
        <div
          className={`modal ${showModal ? "show" : ""}`}
          style={{ display: showModal ? "block" : "none" }}
          id="createpayment"
          tabIndex={-1}
          aria-labelledby="createpayment"
          aria-hidden="true"
          data-bs-backdrop="static"
          data-bs-keyboard="false"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Payment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleModalClose}
                ></button>
              </div>
              <div className="modal-body">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = {
                      amount: e.target.elements.amount.value,
                      paymentMethod: e.target.elements.paymentMethod.value,
                      note: e.target.elements.note.value,
                    };
                    handleReceivePayment(selectedOrder, formData);
                  }}
                >
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="form-group row align-items-center">
                        <label className="col-sm-3 col-form-label">
                          Payment Date
                        </label>
                        <div className="col-sm-9">
                          <DatePicker
                            className="form-control"
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Choose Date"
                            portalId="root"
                            popperModifiers={{
                              preventOverflow: {
                                enabled: true,
                                escapeWithReference: false,
                                boundariesElement: "viewport",
                              },
                            }}
                            popperProps={{
                              positionFixed: true,
                            }}
                            getPopupContainer={(triggerNode) => {
                              return triggerNode.parentNode;
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group row align-items-center">
                        <label className="col-sm-3 col-form-label">
                          Memo Amount
                        </label>
                        <div className="col-sm-9">
                          <div className="input-group">
                            <span className="input-group-text">৳</span>
                            <input
                              type="number"
                              name="memoAmount"
                              className="form-control"
                              disabled
                              step="0.01"
                              defaultValue={
                                selectedOrderDetails
                                  ? selectedOrderDetails.totalAmount - selectedOrderDetails.discountAmount
                                  : ""
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group row align-items-center">
                        <label className="col-sm-3 col-form-label">
                          Already Paid
                        </label>
                        <div className="col-sm-9">
                          <div className="input-group">
                            <span className="input-group-text">৳</span>
                            <input
                              type="number"
                              name="paidAmount"
                              className="form-control"
                              disabled
                              step="0.01"
                              defaultValue={
                                selectedOrderDetails
                                  ? selectedOrderDetails.paidAmount
                                  : ""
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group row align-items-center">
                        <label className="col-sm-3 col-form-label">
                          Amount
                        </label>
                        <div className="col-sm-9">
                          <div className="input-group">
                            <span className="input-group-text">৳</span>
                            <input
                              type="number"
                              name="amount"
                              className="form-control"
                              required
                              step="1"
                              max={selectedOrderDetails
                                ? selectedOrderDetails.totalAmount - selectedOrderDetails.discountAmount - selectedOrderDetails.paidAmount
                                : "0.00"}
                              defaultValue={
                                selectedOrderDetails
                                  ? selectedOrderDetails.totalAmount - selectedOrderDetails.discountAmount - selectedOrderDetails.paidAmount
                                  : ""
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group row align-items-center">
                        <label className="col-sm-3 col-form-label">
                          Payment Method
                        </label>
                        <div className="col-sm-9">
                          <Select
                            className="select"
                            name="paymentMethod"
                            options={[
                              { value: "Cash", label: "Cash" },
                              { value: "Card", label: "Card" },
                              {
                                value: "Bank Transfer",
                                label: "Bank Transfer",
                              },
                              {
                                value: "Mobile Banking",
                                label: "Mobile Banking",
                              },
                            ]}
                            placeholder="Select Payment Method"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group row">
                        <label className="col-sm-3 col-form-label">Note</label>
                        <div className="col-sm-9">
                          <textarea
                            className="form-control"
                            name="note"
                            rows="2"
                            maxLength="60"
                          ></textarea>
                          <small className="text-muted">
                            Maximum 60 characters
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top-0">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleModalClose}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Submit Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {/* Create payment Modal */}
        
        <div className="customizer-links" id="setdata">
          <ul className="sticky-sidebar">
            <li className="sidebar-icons">
              <Link
                to="#"
                className="navigation-add"
                data-bs-toggle="tooltip"
                data-bs-placement="left"
                data-bs-original-title="Theme"
              >
                <i data-feather="settings" className="feather-five" />
              </Link>
            </li>
          </ul>
        </div>
      </>
    </div>
  );
};

export default SalesList;
