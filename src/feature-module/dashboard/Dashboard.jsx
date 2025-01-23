import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import {
  File,
  User,
  // UserCheck,
} from "feather-icons-react/build/IconComponents";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import { ArrowRight } from "react-feather";
import { all_routes } from "../../Router/all_routes";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

const Dashboard = () => {
  const route = all_routes;
  const [chartOptions] = useState({
    series: [
      {
        name: "Sales",
        data: [130, 210, 300, 290, 150, 50, 210, 280, 105, 150, 200, 250],
      },
      // {
      //   name: "Purchase",
      //   data: [-150, -90, -50, -180, -50, -70, -100, -90, -105],
      // },
    ],
    colors: ["#28C76F"],
    chart: {
      type: "bar",
      height: 320,
      stacked: true,
      zoom: {
        enabled: true,
      },
    },
    responsive: [
      {
        breakpoint: 280,
        options: {
          legend: {
            position: "bottom",
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        borderRadiusApplication: "end", // "around" / "end"
        borderRadiusWhenStacked: "all", // "all"/"last"
        columnWidth: "20%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      min: 0,
      max: 300,
      tickAmount: 5,
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
    },
    legend: { show: false },
    fill: {
      opacity: 1,
    },
  });
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

  const [recentProducts, setRecentProducts] = useState([]);
  const [expiredProducts, setExpiredProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://rpbazaar.xyz/api/get_all_product.php', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.products) {
          setRecentProducts(data.products.slice(0, 4));
          setExpiredProducts(data.products.filter(product => 
            product.productStatus === 'Inactive' || product.productStatus === 'Expired'
          ).slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setRecentProducts([]);
        setExpiredProducts([]);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            {/* <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-widget w-100">
                <div className="dash-widgetimg">
                  <span>
                    <ImageWithBasePath
                      src="assets/img/icons/dash1.svg"
                      alt="img"
                    />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    <CountUp start={0} end={307144} duration={3} prefix="৳" />
                  </h5>
                  <h6>Total Purchase Due</h6>
                </div>
              </div>
            </div> */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-widget dash1 w-100">
                <div className="dash-widgetimg">
                  <span>
                    <ImageWithBasePath
                      src="assets/img/icons/dash2.svg"
                      alt="img"
                    />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    $
                    <CountUp
                      start={0}
                      end={4385}
                      duration={3} // Duration in seconds
                    />
                  </h5>
                  <h6>Total Sales Amount</h6>
                </div>
              </div>
            </div>
            {/* <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-widget dash2 w-100">
                <div className="dash-widgetimg">
                  <span>
                    <ImageWithBasePath
                      src="assets/img/icons/dash3.svg"
                      alt="img"
                    />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    $
                    <CountUp
                      start={0}
                      end={385656.5}
                      duration={3} // Duration in seconds
                      decimals={1}
                    />
                  </h5>
                  <h6>Total Sale Amount</h6>
                </div>
              </div>
            </div> */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-widget dash3 w-100">
                <div className="dash-widgetimg">
                  <span>
                    <ImageWithBasePath
                      src="assets/img/icons/dash4.svg"
                      alt="img"
                    />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    $
                    <CountUp
                      start={0}
                      end={40000}
                      duration={3} // Duration in seconds
                    />
                  </h5>
                  <h6>Total Expense Amount</h6>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count">
                <div className="dash-counts">
                  <h4>100</h4>
                  <h5>Customers</h5>
                </div>
                <div className="dash-imgs">
                  <User />
                </div>
              </div>
            </div>
            {/* <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das1">
                <div className="dash-counts">
                  <h4>110</h4>
                  <h5>Suppliers</h5>
                </div>
                <div className="dash-imgs">
                  <UserCheck />
                </div>
              </div>
            </div> */}
            {/* <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das2">
                <div className="dash-counts">
                  <h4>150</h4>
                  <h5>Purchase Invoice</h5>
                </div>
                <div className="dash-imgs">
                  <ImageWithBasePath
                    src="assets/img/icons/file-text-icon-01.svg"
                    className="img-fluid"
                    alt="icon"
                  />
                </div>
              </div>
            </div> */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das3">
                <div className="dash-counts">
                  <h4>170</h4>
                  <h5>Sales Invoice</h5>
                </div>
                <div className="dash-imgs">
                  <File />
                </div>
              </div>
            </div>
          </div>
          {/* Button trigger modal */}

          <div className="row">
            <div className="col-xl-7 col-sm-12 col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Sales Graph</h5>
                  <div className="graph-sets">
                    <ul className="mb-0">
                      <li>
                        <span>Sales</span>
                      </li>
                      {/* <li>
                        <span>Purchase</span>
                      </li> */}
                    </ul>
                    <div className="dropdown dropdown-wraper">
                      <button
                        className="btn btn-light btn-sm dropdown-toggle"
                        type="button"
                        id="dropdownMenuButton"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        2025
                      </button>
                      <ul
                        className="dropdown-menu"
                        aria-labelledby="dropdownMenuButton"
                      >
                        <li>
                          <Link to="#" className="dropdown-item">
                          2025
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div id="sales_charts" />
                  <Chart
                    options={chartOptions}
                    series={chartOptions.series}
                    type="bar"
                    height={320}
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-5 col-sm-12 col-12 d-flex">
              <div className="card flex-fill default-cover mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">Recent Products</h4>
                  <div className="view-all-link">
                    <Link to="product-list" className="view-all d-flex align-items-center">
                      View All
                      <span className="ps-2 d-flex align-items-center">
                        <ArrowRight className="feather-16" />
                      </span>
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive dataview">
                    <table className="table dashboard-recent-products">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Products</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentProducts.map((product, index) => (
                          <tr key={product.productID}>
                            <td>{index + 1}</td>
                            <td className="productimgname">
                              <Link to={route.productlist} className="product-img">
                                <img
                                  src={product.imageUrl?.replace(/^\//, '') || "assets/img/products/stock-img-01.png"}
                                  alt="product"
                                />
                              </Link>
                              <Link to={route.productlist}>
                                {product.productEnName} ({product.productBnName})
                              </Link>
                            </td>
                            <td>৳{product.regularPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Expired Products</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive dataview">
                <table className="table dashboard-expired-products">
                  <thead>
                    <tr>
                      <th className="no-sort">
                        <label className="checkboxs">
                          <input type="checkbox" id="select-all" />
                          <span className="checkmarks" />
                        </label>
                      </th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Manufactured Date</th>
                      <th>Expired Date</th>
                      <th className="no-sort">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiredProducts.map((product) => (
                      <tr key={product.productID}>
                        <td>
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                        </td>
                        <td>
                          <div className="productimgname">
                            <Link to="#" className="product-img stock-img">
                              <ImageWithBasePath
                                src={product.imageUrl?.replace(/^\//, '') || "assets/img/products/stock-img-01.png"}
                                alt="product"
                              />
                            </Link>
                            <Link to="#">{product.productEnName}</Link>
                          </div>
                        </td>
                        <td>
                          <Link to="#">{product.productID}</Link>
                        </td>
                        <td>N/A</td>
                        <td>N/A</td>
                        <td className="action-table-data">
                          <div className="edit-delete-action">
                            <Link className="me-2 p-2" to="#">
                              <i data-feather="edit" className="feather-edit" />
                            </Link>
                            <Link className="confirm-text p-2" to="#" onClick={showConfirmationAlert}>
                              <i data-feather="trash-2" className="feather-trash-2" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
