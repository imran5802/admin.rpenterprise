import React, { useState, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import Breadcrumbs from "../../core/breadcrumbs";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import { StopCircle, Map, X } from "feather-icons-react/build/IconComponents";
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
  const [showModal, setShowModal] = useState(false);
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
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/customers`
      );
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/products`
      );
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Modified Add Product handler: alert user if the same product is already added
  const handleAddProduct = (product) => {
    // First check if quantity and price are valid
    if (tempQuantity <= 0 || tempPrice <= 0) {
        alert("Quantity and price must be greater than 0.");
        return;
    }

    // Check if product is already in the list
    const existingProductIndex = selectedProducts.findIndex(p => p.productID === product.productID);

    if (existingProductIndex !== -1) {
        // Product exists - show alert
        alert("Product Already Added");
        return;
    }

    // Add new product
    setSelectedProducts([
        ...selectedProducts,
        {
            ...product,
            quantity: tempQuantity,
            price: tempPrice
        }
    ]);

    // Reset temp values
    setTempProduct(null);
    setTempQuantity(1);
    setTempPrice(0);
};

  const handleProductQuantityChange = (index, quantity) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].quantity = quantity;
    setSelectedProducts(updatedProducts);
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  const filterSales = useCallback(() => {
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
  }, [sales, searchTerm, selectedStatus, selectedPaymentStatus]);

  useEffect(() => {
    filterSales();
  }, [filterSales]);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/sales`
      );
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
        `${process.env.REACT_APP_API_BASE_URL}/api/sales/${orderId}/status`,
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
        `${process.env.REACT_APP_API_BASE_URL}/api/sales/${orderId}/payment`,
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

  const handleDiscountChange = (e) => {
    setDiscount(Number(e.target.value));
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const totalAmount = selectedProducts.reduce(
      (sum, p) => sum + p.quantity * p.price,
      0
    );
    const discountAmount = parseFloat(
      document.querySelector('input[name="discountAmount"]')?.value || "0"
    );

    //const customerID = formData.get("customerID"); // Removed

    // Check if customer is selected
    if (!selectedCustomer) { // Modified
      Swal.fire({
        title: "Error!",
        text: "Please select a customer.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const newSale = {
      orderDate: new Date(),
      totalAmount,
      discountAmount,
      orderStatus: "Confirmed",
      customerID: selectedCustomer.value || 0, // Get the selected customer ID // Modified
      shippingAddress: formData.get("shippingAddress"),
      plusCode: "",
      latitude: 0,
      longitude: 0,
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Unpaid",
      products: selectedProducts.map((product) => ({
      productID: product.productID,
      quantity: product.quantity,
      price: product.price,
      })),
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/sales`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newSale),
        }
      );
      const data = await response.json();
      if (data.success) {
        Swal.fire({
          title: "Success!",
          text: "Sale has been added successfully.",
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            fetchSales();
            document.querySelector("#add-units .btn-close").click();
          }
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: data.error || "Failed to add sale.", // Display server error
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      console.error("Error adding sale:", err);
      Swal.fire({
        title: "Error!",
        text: err.message || "An error occurred while adding the sale.", // Display client error
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

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
          <Breadcrumbs
            maintitle="Sales List"
            subtitle="Manage Your Sales"
            addButton="Add New Sales"
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
                            <div>
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
                            </div>
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
                              {sale.orderStatus === "Cancelled"
                                ? "Cancelled"
                                : sale.paymentStatus}
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
                                    disabled={
                                      sale.paymentStatus === "Paid" ||
                                      sale.orderStatus === "Cancelled"
                                    }
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
        {/* Add Sales */}
        <div className="modal fade" id="add-units" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered custom-modal-two modal-lg">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header border-0 custom-modal-header">
                    <div className="page-title">
                      <h4>Add Sales</h4>
                      <button
                        type="button"
                        className="btn-close position-absolute"
                        style={{ right: "20px", top: "20px" }}
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      >
                        <X className="info-img" />
                      </button>
                    </div>
                  </div>
                  <div className="modal-body custom-modal-body">
                    <form onSubmit={handleAddSubmit}>
                      <div className="row">
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Customer</label>
                            <Select
                              className="select"
                              options={customers.map((customer) => ({
                                value: customer.userId,
                                label: customer.userName,
                              }))}
                              placeholder="Select Customer"
                              onChange={setSelectedCustomer}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Shipping Address
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="shippingAddress"
                              required
                            />
                          </div>
                        </div>

                        <div className="col-lg-12">
                          <div className="mb-3">
                            <label className="form-label">Products</label>
                            <Select
                              className="select"
                              options={products.map((product) => ({
                                value: product.productID,
                                label: product.productEnName,
                              }))}
                              placeholder="Select Product"
                              value={tempProduct}
                              onChange={(option) => {
                                setTempProduct(option);
                                const prod = products.find(
                                  (p) => p.productID === option.value
                                );
                                setTempPrice(prod ? prod.regularPrice : 0);
                              }}
                            />
                          </div>
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Quantity</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={tempQuantity}
                                  min="1"
                                  onChange={(e) =>
                                    setTempQuantity(parseInt(e.target.value))
                                  }
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Price</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={tempPrice}
                                  min="1"
                                  step="1"
                                  onChange={(e) =>
                                    setTempPrice(parseFloat(e.target.value))
                                  }
                                />
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                if (tempProduct) {
                                  handleAddProduct({
                                    productID: tempProduct.value,
                                    productEnName: tempProduct.label,
                                    quantity: tempQuantity,
                                    price: tempPrice,
                                  });
                                  // Optionally, reset temp fields here:
                                  setTempProduct(null);
                                  setTempQuantity(1);
                                  setTempPrice(0);
                                }
                              }}
                            >
                              Add Product
                            </button>
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Selected Products
                            </label>
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>Product Name</th>
                                  <th>Quantity</th>
                                  <th>Item Total</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProducts.map((product, index) => (
                                  <tr key={product.productID}>
                                    <td>{product.productEnName}</td>
                                    <td>
                                      <input
                                        type="number"
                                        value={product.quantity}
                                        min="1"
                                        onChange={(e) =>
                                          handleProductQuantityChange(
                                            index,
                                            parseInt(e.target.value)
                                          )
                                        }
                                      />
                                    </td>
                                    <td>
                                      {(
                                        product.quantity * product.price
                                      ).toFixed(2)}
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() =>
                                          handleRemoveProduct(index)
                                        }
                                      >
                                        <i className="fa-solid fa-trash"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan="2" className="text-end">Memo Total =</td>
                                  <td>
                                    {selectedProducts
                                      .reduce(
                                        (sum, p) => sum + p.quantity * p.price,
                                        0
                                      )
                                      .toFixed(2)}
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan="2" className="text-end">Discount =</td>
                                  <td>
                                    <input
                                      type="number"
                                      name="discountAmount"
                                      defaultValue="0"
                                      step="1"
                                      value={discount}
                                      onChange={handleDiscountChange}
                                      placeholder="Discount"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan="2" className="text-end">Grand Total =</td>
                                  <td>
                                    {(
                                      selectedProducts.reduce(
                                        (sum, p) => sum + p.quantity * p.price,
                                        0
                                      ) -
                                      parseFloat(
                                        document.querySelector(
                                          'input[name="discountAmount"]'
                                        )?.value || "0"
                                      )
                                    ).toFixed(2)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer-btn">
                        <Link
                          to="#"
                          className="btn btn-cancel me-2"
                          data-bs-dismiss="modal"
                        >
                          Cancel
                        </Link>
                        <button type="submit" className="btn btn-submit">
                          Submit
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Add Expense */}
        {/* details popup */}
        <div className="modal fade" id="sales-details-new">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="details-blk">
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
                            className="feather-printer"
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
                                  ? selectedOrderDetails.totalAmount -
                                    selectedOrderDetails.discountAmount
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
                              max={
                                selectedOrderDetails
                                  ? selectedOrderDetails.totalAmount -
                                    selectedOrderDetails.discountAmount -
                                    selectedOrderDetails.paidAmount
                                  : "0.00"
                              }
                              defaultValue={
                                selectedOrderDetails
                                  ? selectedOrderDetails.totalAmount -
                                    selectedOrderDetails.discountAmount -
                                    selectedOrderDetails.paidAmount
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
