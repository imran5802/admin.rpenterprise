import React, { useState, useEffect, useRef } from "react";
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
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    console.log('EditProduct mounted, id:', id);
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/product_details/${id}`);
        
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.product) {
        setFormData(data.product);
      } else {
        setError(data.message || 'Failed to fetch product details');
      }
    } catch (error) {
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const cleanFormData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== '') {
          cleanFormData[key] = formData[key];
        }
      });

      const formDataToSend = new FormData();
      
      // Append clean form data
      Object.keys(cleanFormData).forEach(key => {
        formDataToSend.append(key, cleanFormData[key]);
      });

      // Handle file upload with custom filename
      if (fileInputRef.current.files[0]) {
        const file = fileInputRef.current.files[0];
        // Create a safe filename using product name
        const safeProductName = cleanFormData.productEnName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const extension = file.name.split('.').pop();
        const newFileName = `product_${safeProductName}.${extension}`;
        
        // Create a new File object with the custom filename
        const renamedFile = new File([file], newFileName, { type: file.type });
        formDataToSend.append('file', renamedFile);
      }

      const response = await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/update_product/${id}`, 
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Server response:', response.data);

      if (response.data.success) {
        await MySwal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Product updated successfully',
          showConfirmButton: true,
          confirmButtonText: 'OK',
          timer: 2000,
          timerProgressBar: true
        });
        navigate('/product-list');
      } else {
        throw new Error(response.data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error details:', error.response?.data || error);
      await MySwal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.response?.data?.error || error.message || 'Failed to update product',
        showConfirmButton: true
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
              <button className="btn btn-secondary" onClick={() => navigate('/product-list')}>
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
                    <label>Product Image</label>
                    <input
                      type="text"
                      className="form-control mb-2"
                      name="imageUrl"
                      value={formData.imageUrl}
                      readOnly
                    />
                    <div className="image-preview mb-2">
                      {(previewImage || formData.imageUrl) && (
                        <div className="position-relative" style={{ maxWidth: '200px' }}>
                          <img
                            src={previewImage || formData.imageUrl}
                            alt="Product"
                            className="img-fluid rounded"
                            style={{
                              width: '100%',
                              height: '200px',
                              objectFit: 'cover',
                              border: '1px solid #ddd'
                            }}
                          />
                          {previewImage && (
                            <button
                              type="button"
                              className="btn btn-sm btn-danger position-absolute"
                              style={{ top: '5px', right: '5px' }}
                              onClick={() => {
                                setPreviewImage(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="custom-file">
                      <input
                        type="file"
                        className="form-control"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                      <small className="form-text text-muted">
                        Select a new image to update the current one
                      </small>
                    </div>
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
