import React, { useEffect, useState, useCallback } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import {
  ChevronUp,
  RotateCcw,
  StopCircle,
} from "feather-icons-react/build/IconComponents";
import { setToogleHeader } from "../../core/redux/action";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import Table from "../../core/pagination/datatable";

const InvoiceReport = () => {
  // 1. State declarations
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(null);

  const dispatch = useDispatch();
  const data = useSelector((state) => state.toggle_header);

  // 2. Options and constants
  const paymentStatusOptions = [
    { value: "all", label: "All Payments" },
    { value: "Paid", label: "Paid" },
    { value: "Unpaid", label: "Unpaid" },
    { value: "Canceled", label: "Canceled" },
  ];

  // 3. Tooltip functions
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
    <Tooltip id="collapse-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  // 4. Handler functions
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handlePaymentStatusChange = (selected) => {
    setSelectedPaymentStatus(selected);
  };

  // 5. Data fetching and filtering
  const fetchSales = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/sales`);
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

  const filterSales = useCallback(() => {
    let filtered = [...sales];

    if (selectedPaymentStatus?.value && selectedPaymentStatus.value !== "all") {
      filtered = filtered.filter(
        (sale) => sale.paymentStatus === selectedPaymentStatus.value
      );
    }

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
  }, [sales, searchTerm, selectedPaymentStatus]);

  // 6. Effects
  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [searchTerm, selectedPaymentStatus, sales, filterSales]);

  // 7. Table columns configuration
  const columns = [
    {
      title: "orderNumber",
      dataIndex: "orderNumber",
      sorter: (a, b) => a.orderNumber.length - b.orderNumber.length,
    },

    {
      title: "customerName",
      dataIndex: "customerName",
      sorter: (a, b) => a.customerName.length - b.customerName.length,
    },
    {
      title: "orderDate",
      dataIndex: "orderDate",
      sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
      render: (text) => {
        const date = new Date(text);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
      },
    },
    {
      title: "totalAmount",
      dataIndex: "totalAmount",
      sorter: (a, b) => a.totalAmount.length - b.totalAmount.length,
    },
    {
      title: "paidAmount",
      dataIndex: "paidAmount",
      sorter: (a, b) => a.paidAmount.length - b.paidAmount.length,
    },
    {
      title: "dueAmount",
      dataIndex: "dueAmount",
      sorter: (a, b) => a.dueAmount.length - b.dueAmount.length,
    },

    {
      title: "Status",
      dataIndex: "paymentStatus",
      render: (text) => (
        <div>
          {text === "Paid" && (
            <span className="badge badge-linesuccess">{text}</span>
          )}
          {text === "Unpaid" && (
            <span className="badge badge-linedanger">{text}</span>
          )}
          {text === "Partial" && (
            <span className="badge badge-linedanger">{text}</span>
          )}
          {text === "Canceled" && (
            <span className="badge badges-warning">{text}</span>
          )}
        </div>
      ),
      sorter: (a, b) => a.paymentStatus.length - b.paymentStatus.length,
    },
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Invoice Report </h4>
                <h6>Manage Your Invoice Report</h6>
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
              <div className="table-responsive">
                <Table columns={columns} dataSource={filteredSales} fixedHeader={true} />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
      </div>
    </div>
  );
};

export default InvoiceReport;
