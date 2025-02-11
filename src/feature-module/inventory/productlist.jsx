import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronUp,
  Edit,
  Eye,
  PlusCircle,
  RotateCcw,
  StopCircle
} from "feather-icons-react/build/IconComponents";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Select from "react-select";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import Brand from "../../core/modals/inventory/brand";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { all_routes } from "../../Router/all_routes";
import { OverlayTrigger, Tooltip, Spinner } from "react-bootstrap";
import Table from "../../core/pagination/datatable";
import { setToogleHeader } from "../../core/redux/action";
import AddProduct from "./addproduct";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState({value: 'all', label: 'All'});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState({ value: 'all', label: 'All' });
  const [showAddProduct, setShowAddProduct] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const filterProducts = useCallback(() => {
    let filtered = products;

    if (selectedCategory && selectedCategory.value !== 'all') {
      filtered = filtered.filter(product => product.productCategory === selectedCategory.value);
    }

    if (selectedStatus && selectedStatus.value !== 'all') {
      filtered = filtered.filter(product => product.productStatus === selectedStatus.value);
    }

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.productEnName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productBnName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/products`);
  
      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }
  
      // Parse JSON response
      const data = await response.json();
  
      // Validate the structure of the response
      if (!data.success || !data.products) {
        throw new Error('Invalid API response structure');
      }
  
      // Extract products from the response
      const products = data.products;
  
      // Update state
      setProducts(products);
      setFilteredProducts(products);
  
      // Extract unique categories for filtering
      const categories = Array.from(new Set(products.map(product => product.productCategory)));
      setCategoryOptions([
        { value: 'all', label: 'All' },
        ...categories.map(category => ({ value: category, label: category })),
      ]);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      // Ensure loading state is updated
      setLoading(false);
    }
  };  

  const handleCategoryChange = (selectedOption) => {
    setSelectedCategory(selectedOption);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusChange = (selectedOption) => {
    setSelectedStatus(selectedOption);
  };

  const dispatch = useDispatch();
  const data = useSelector((state) => state.toggle_header);

  const route = all_routes;

  const handleStatusToggle = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${currentStatus === 'Active' ? 'deactivate' : 'activate'} this product?`,
      showCancelButton: true,
      confirmButtonColor: "#00ff00",
      cancelButtonColor: "#ff0000",
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/products/${productId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Failed to update status');
        }

        // Update the local state
        setProducts(products.map(product => 
          product.productID === productId 
            ? {...product, productStatus: newStatus}
            : product
        ));
        setFilteredProducts(filteredProducts.map(product => 
          product.productID === productId 
            ? {...product, productStatus: newStatus}
            : product
        ));

        MySwal.fire({
          title: 'Updated!',
          text: `Product status has been ${newStatus === 'Active' ? 'activated' : 'deactivated'}.`,
          icon: 'success',
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error('Error updating status:', error);
        MySwal.fire({
          title: 'Error!',
          text: 'Failed to update product status.',
          icon: 'error',
          confirmButtonText: "OK",
        });
      }
    }
  };

  const handleAddProduct = (newProduct) => {
    // Update products state
    setProducts(prevProducts => [...prevProducts, newProduct]);
    setFilteredProducts(prevFiltered => [...prevFiltered, newProduct]);
    
    // Close modal
    setShowAddProduct(false);
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "productEnName",
      width: '300px',
      render: (text, record) => (
        <span className="productimgname" style={{ 
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'normal',
          wordBreak: 'break-word'
        }}>
          <div className="product-img stock-img">
            <img 
              alt={text} 
              src={record.imageUrl?.replace(/^\//, '') ?? "assets/img/products/stock-img-01.png"} 
              style={{ width: '30px', height: '30px', objectFit: 'fit', marginRight: '10px' }}
            />
          </div>
          <span style={{ flex: 1 }}>{text} ({record.productBnName})</span>
        </span>
      ),
    },
    {
      title: "Category",
      dataIndex: "productCategory",
      sorter: (a, b) => a.productCategory.localeCompare(b.productCategory),
    },
    {
      title: "Unit",
      dataIndex: "productUnit",
    },
    {
      title: "Regular Price",
      dataIndex: "regularPrice",
    },
    {
      title: "Discount Price",
      dataIndex: "discountPrice",
    },
    {
      title: "Status",
      dataIndex: "productStatus",
      render: (status, record) => (
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id={`status-${record.productID}`}
            checked={status === 'Active'}
            onChange={() => handleStatusToggle(record.productID, status)}
          />
          <label className="form-check-label" htmlFor={`status-${record.productID}`}>
            {status}
          </label>
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <div className="edit-delete-action">
          <Link className="me-2 p-2" to={`${route.productdetails}/${record.productID}`}>
            <Eye className="feather-view" />
          </Link>
          <Link className="me-2 p-2" to={`${route.editproduct}/${record.productID}`}>
            <Edit className="feather-edit" />
          </Link>
        </div>
      ),
    },
  ];

  const MySwal = withReactContent(Swal);

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
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Product List</h4>
              <h6>Manage your products</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li key="pdf">
              <OverlayTrigger placement="top" overlay={renderTooltip}>
                <Link>
                  <ImageWithBasePath src="assets/img/icons/pdf.svg" alt="img" />
                </Link>
              </OverlayTrigger>
            </li>
            <li key="excel">
              <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
                <Link data-bs-toggle="tooltip" data-bs-placement="top">
                  <ImageWithBasePath
                    src="assets/img/icons/excel.svg"
                    alt="img"
                  />
                </Link>
              </OverlayTrigger>
            </li>
            <li key="printer">
              <OverlayTrigger placement="top" overlay={renderPrinterTooltip}>
                <Link data-bs-toggle="tooltip" data-bs-placement="top">
                  <i data-feather="printer" className="feather-printer" />
                </Link>
              </OverlayTrigger>
            </li>
            <li key="refresh">
              <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                <Link data-bs-toggle="tooltip" data-bs-placement="top">
                  <RotateCcw />
                </Link>
              </OverlayTrigger>
            </li>
            <li key="collapse">
              <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                <Link
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  id="collapse-header"
                  className={data ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(setToogleHeader(!data));
                  }}
                >
                  <ChevronUp />
                </Link>
              </OverlayTrigger>
            </li>
          </ul>
          <div className="page-btn">
            <button 
              className="btn btn-added"
              onClick={() => setShowAddProduct(true)}
            >
              <PlusCircle className="me-2 iconsize" />
              Add New Product
            </button>
          </div>
        </div>
        {/* /product list */}
        <div className="card table-list-card">
          <div className="card-body">
            {loading ? (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : (
              <>
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
                  <div className="d-flex align-items-center" style={{ gap: '15px' }}>
                    <div className="d-flex align-items-center" style={{ width: '200px' }}> 
                      <label className="me-2 mb-0">Status:</label>
                      <div className="form-sort flex-grow-1">
                        <StopCircle className="info-img" />
                        <Select
                          className="select"
                          options={statusOptions}
                          placeholder="Choose Status"
                          onChange={handleStatusChange}
                          value={selectedStatus}
                        />
                      </div>
                    </div>
                    <div className="d-flex align-items-center" style={{ width: '250px' }}> 
                      <label className="me-2 mb-0">Category:</label>
                      <div className="form-sort flex-grow-1">
                        <StopCircle className="info-img" />
                        <Select
                          className="select"
                          options={categoryOptions}
                          placeholder="Choose Category"
                          onChange={handleCategoryChange}
                          value={selectedCategory}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Filter */}
                <div className="table-responsive">
                  <Table 
                    columns={columns} 
                    dataSource={filteredProducts.map(product => ({ ...product, key: product.productID }))}
                    loading={loading}
                    rowKey={(record) => record.productID}
                    bordered={true}
                    sticky={true}
                    pagination={true}
                    size="middle"
                    rowSelection={false}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        {/* /product list */}
        <Brand />
        <AddProduct 
          show={showAddProduct} // Ensure show prop is always defined
          onHide={() => setShowAddProduct(false)}
          onSubmit={handleAddProduct}
        />
      </div>
    </div>
  );
};

export default ProductList;
