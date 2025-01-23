import {
  ChevronUp,
  Edit,
  Eye,
  PlusCircle,
  RotateCcw,
  StopCircle,
  Trash2,
} from "feather-icons-react/build/IconComponents";
import React, { useState, useEffect } from "react";
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

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('https://rpbazaar.xyz/api/get_all_product.php');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        setFilteredProducts(data.products);
        const categories = Array.from(new Set(data.products.map(product => product.productCategory)));
        setCategoryOptions([{ value: 'all', label: 'All' }, ...categories.map(category => ({ value: category, label: category }))]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory && selectedCategory.value !== 'all') {
      filtered = filtered.filter(product => product.productCategory === selectedCategory.value);
    }

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.productEnName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productBnName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleCategoryChange = (selectedOption) => {
    setSelectedCategory(selectedOption);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const dispatch = useDispatch();
  const data = useSelector((state) => state.toggle_header);

  const route = all_routes;

  const columns = [
    {
      title: "Product",
      dataIndex: "productEnName",
      render: (text, record) => (
        <span className="productimgname">
          <div className="product-img stock-img">
            <img 
              alt={text} 
              src={record.imageUrl?.replace(/^\//, '') ?? "assets/img/products/stock-img-01.png"} 
              style={{ width: '40px', height: '30px', objectFit: 'fit', marginRight: '10px' }}
            />
          </div>
          <span>{text} ({record.productBnName})</span>
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
          <Link className="confirm-text p-2" to="#" onClick={showConfirmationAlert}>
            <Trash2 className="feather-trash-2" />
          </Link>
        </div>
      ),
    },
  ];

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
            <li>
              <OverlayTrigger placement="top" overlay={renderTooltip}>
                <Link>
                  <ImageWithBasePath src="assets/img/icons/pdf.svg" alt="img" />
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
            <Link to={route.addproduct} className="btn btn-added">
              <PlusCircle className="me-2 iconsize" />
              Add New Product
            </Link>
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
                  <div className="form-sort" style={{ width: '300px' }}> {/* Set fixed width */}
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
                {/* /Filter */}
                <div className="table-responsive">
                  <Table 
                    columns={columns} 
                    dataSource={filteredProducts}
                    loading={loading}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        {/* /product list */}
        <Brand />
      </div>
    </div>
  );
};

export default ProductList;
