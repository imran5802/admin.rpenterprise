import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import MySwal from 'sweetalert2';
import { ArrowLeft } from "feather-icons-react/build/IconComponents";
import axios from 'axios';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    productEnName: '',
    productBnName: '',
    productUnit: '',
    regularPrice: '',
    discountPrice: '',
    productStatus: '',
    productCategory: '',
    imageUrl: '',
    searchTag: '',
  });

  useEffect(() => {
    console.log('EditProduct mounted, id:', id);
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching product details for id:', id);
      
      const response = await fetch(`https://rpbazaar.xyz/api/get_product.php?id=${id}`);
      console.log('Raw response:', response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (data.success && data.product) {
        setFormData(data.product);
      } else {
        console.error('API returned success: false or missing product data:', data);
        setError(data.message || 'Failed to fetch product details');
      }
    } catch (error) {
      console.error('Error in fetchProductDetails:', error);
      setError(`Error fetching product details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    const newFileName = `product_${id}${file.name.substring(file.name.lastIndexOf('.'))}`;
    formData.append('file', file, newFileName);

    try {
      const response = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200) {
        const imageUrl = `/assets/img/${newFileName}`;
        setFormData(prev => ({
          ...prev,
          imageUrl
        }));
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to upload image'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      console.log('Submitting update for id:', id, 'with data:', formData);

      const response = await fetch('https://rpbazaar.xyz/api/update_product.php', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productID: id,
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Update response:', data);

      if (data.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Product updated successfully',
          showConfirmButton: false,
          timer: 1500
        });
        navigate('/product-list');
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Failed to update product'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error</h4>
            <p>{error}</p>
            <hr />
            <div className="mb-0">
              <button className="btn btn-primary me-2" onClick={fetchProductDetails}>
                Retry
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/productlist')}>
                Back to Product List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4>Edit Product</h4>
          </div>
          <Link to="/product-list" className="btn btn-secondary">
            <ArrowLeft className="me-2" />
            Back to Product List
          </Link>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-lg-6 col-sm-6 col-12">
                  <div className="form-group">
                    <label>Product Name (English)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="productEnName"
                      value={formData.productEnName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-6 col-12">
                  <div className="form-group">
                    <label>Product Name (Bengali)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="productBnName"
                      value={formData.productBnName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-6 col-12">
                  <div className="form-group">
                    <label>Product Unit</label>
                    <input
                      type="text"
                      className="form-control"
                      name="productUnit"
                      value={formData.productUnit}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-6 col-12">
                  <div className="form-group">
                    <label>Regular Price</label>
                    <input
                      type="number"
                      className="form-control"
                      name="regularPrice"
                      value={formData.regularPrice}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-6 col-12">
                  <div className="form-group">
                    <label>Discount Price</label>
                    <input
                      type="number"
                      className="form-control"
                      name="discountPrice"
                      value={formData.discountPrice}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-6 col-12">
                  <div className="form-group">
                    <label>Search Tag</label>
                    <input
                      type="text"
                      className="form-control"
                      name="searchTag"
                      value={formData.searchTag}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-6 col-12">
                  <div className="form-group">
                    <label>Product Status</label>
                    <select
                      className="form-control"
                      name="productStatus"
                      value={formData.productStatus}
                      onChange={handleInputChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6 col-sm-6 col-12">
                  <div className="form-group">
                    <label>Product Category</label>
                    <input
                      type="text"
                      className="form-control"
                      name="productCategory"
                      value={formData.productCategory}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-6 col-12">
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="text"
                      className="form-control"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                    />
                    <input
                      type="file"
                      className="form-control mt-2"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
                {/* Add other form fields as needed */}
              </div>
            </div>
          </div>
          
          <div className="col-lg-12">
            <div className="btn-addproduct">
              <button type="button" className="btn btn-cancel me-2" onClick={() => navigate('/product-list')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
