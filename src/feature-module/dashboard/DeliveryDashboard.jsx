import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import { Table } from "antd";
import {
  Truck,
  CheckSquare,
  AlertTriangle,
  File,
  Map,
} from "feather-icons-react/build/IconComponents";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

const DeliveryDashboard = () => {
  const [deliveryStats, setDeliveryStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    canceledDeliveries: 0,
  });

  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controller = new AbortController();
  const signal = controller.signal; // Signal to pass to fetch

  const fetchSalesData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/sales`,
        { method: "GET" }
      );
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        // Filter salesData to only show "Processing" orders by default
        const filteredSales = data.sales.filter(
          (sale) => sale.orderStatus === "Processing"
        );
        setSalesData(filteredSales);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };

  const fetchDeliveryStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/dashboard/delivery-stats`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          mode: "cors",
          signal,
        }
      );
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        setDeliveryStats(data.stats);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setError("Failed to fetch delivery statistics.");
        console.error("Error fetching delivery stats:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {   

    fetchDeliveryStats();
    fetchSalesData();

    return () => controller.abort(); // Cleanup on unmount
  }, []);

  const MySwal = withReactContent(Swal);

  const handleStatusUpdate = async (orderId, newStatus) => {
    // Confirmation dialog for "Completed" status
    if (newStatus === "Completed") {
      const result = await MySwal.fire({
        title: "Are you sure?",
        text: "Do you really want to mark this order as delivered?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, do it!",
        cancelButtonText: "Cancel",
      });
  
      // If user cancels, stop execution
      if (!result.isConfirmed) {
        return;
      }
    }
  
    try {
      // Send PATCH request to update the order status
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
  
      // Handle success
      if (data.success) {
        // Success message
        await MySwal.fire({
          title: "Delivered!",
          text: "Selected order has been marked as delivered.",
          icon: "success",
          confirmButtonText: "OK",
          customClass: {
            confirmButton: "btn btn-success",
          },
        });

        fetchSalesData();
        fetchDeliveryStats();
      } else {
        // Handle failure (if necessary)
        MySwal.fire({
          title: "Error!",
          text: "There was an issue updating the order status.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      // Error handling
      console.error("Error updating status:", err);
      MySwal.fire({
        title: "Error!",
        text: "There was an issue updating the order status.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };
  

  const columns = [
    {
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
    },
    {
      title: "Customer Details",
      dataIndex: "customerDetails",
      key: "customerDetails",
      render: (_, record) => (
        <div className="customer-info">
          <p className="mb-1">
            <strong>{record.customerName}</strong>
          </p>
          <p className="mb-1 text-muted small">
            <i className="far fa-envelope me-1"></i>
            {record.customerEmail}
          </p>
          <p className="mb-1 text-muted small">
            <i className="fas fa-phone me-1"></i>
            {record.customerPhone}
          </p>
          <p className="mb-1 text-muted small">
            <i className="fas fa-map-marker-alt me-1"></i>
            {record.shippingAddress}
            {record.latitude && record.longitude && (
              <a
                href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-primary ms-2"
                title={`Plus Code: ${record.plusCode}`}
              >
                <Map size={14} />
              </a>
            )}
          </p>
        </div>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (text) => `৳${parseFloat(text).toFixed(2)}`,
    },
    {
      title: "Order Status",
      dataIndex: "orderStatus",
      key: "orderStatus",
      render: (text) => (
        <span
          className={`badge ${
            text === "Completed"
              ? "badge-success"
              : text === "Confirmed"
              ? "badge-warning"
              : text === "Processing"
              ? "badge-info"
              : "badge-danger"
          }`}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Order Date",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => (
        <td className="action-table-data">
          <div className="edit-delete-action">
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleStatusUpdate(record.orderID, "Completed")}
            >
              Mark as Delivered
            </button>
          </div>
        </td>
      ),
    },
  ];

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row">
            {loading ? (
              <p>Loading delivery stats...</p>
            ) : (
              <>
                {[
                  {
                    icon: <Truck />,
                    value: deliveryStats.totalDeliveries,
                    label: "Total Deliveries",
                  },
                  {
                    icon: <AlertTriangle />,
                    value: deliveryStats.pendingDeliveries,
                    label: "Pending Deliveries",
                  },
                  {
                    icon: <CheckSquare />,
                    value: deliveryStats.completedDeliveries,
                    label: "Completed Deliveries",
                  },
                  {
                    icon: <File />,
                    value: deliveryStats.canceledDeliveries,
                    label: "Canceled Deliveries",
                  },
                ].map((stat, index) => (
                  <div key={index} className="col-xl-3 col-sm-6 col-12 d-flex">
                    <div className="dash-widget w-100">
                      <div className="dash-widgetimg">
                        <span>{stat.icon}</span>
                      </div>
                      <div className="dash-widgetcontent">
                        <h5>
                          <CountUp start={0} end={stat.value} duration={3} />
                        </h5>
                        <h6>{stat.label}</h6>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Sales DataTable */}
          <div className="card mt-4">
            <div className="card-header">
              <h4>Recent Sales</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <Table
                rowKey={(record) => record.orderID}
                  columns={columns}
                  dataSource={salesData}
                  size="small"
                  rowSelection={false}
                  expandable={{
                    expandedRowRender: (record) => (
                      <div className="col-md-8">
                        <h4>Products</h4>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Product Name</th>
                              <th>Unit</th>
                              <th>Price</th>
                              <th>Quantity</th>
                              <th>Total Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.products.map((product) => (
                              <tr key={product.productID}>
                                <td>{product.productEnName}</td>
                                <td>{product.productUnit}</td>
                                <td>{`৳${parseFloat(product.price).toFixed(
                                  2
                                )}`}</td>
                                <td>{product.quantity}</td>
                                <td>{`৳${parseFloat(product.totalCost).toFixed(
                                  2
                                )}`}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ),
                    rowExpandable: (record) =>
                      record.products && record.products.length > 0, // Check if products exist
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
