import React, { useState, useEffect } from "react";
import Select from "react-select";
import PropTypes from 'prop-types';
import AddCategory from '../../core/modals/inventory/addcategory';
import AddUnit from '../../core/modals/inventory/addunit';
import Swal from 'sweetalert2';

const AddProduct = ({ show, onHide, onSubmit }) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  const [formData, setFormData] = useState({
    productEnName: "",
    productBnName: "",
    productUnit: "kg",
    regularPrice: "",
    discountPrice: "",
    searchTag: "",
    productStatus: "Active", // Changed default to Active
    productCategory: "",
    imageUrl: ""
  });

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [originalFile, setOriginalFile] = useState(null);  // Add this new state

  useEffect(() => {
    fetchCategories();
    fetchUnits();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategoryOptions(data.categories.map(cat => ({
          value: cat.catName,
          label: cat.catName
        })));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/units');
      const data = await response.json();
      if (data.success) {
        setUnitOptions(data.units.map(unit => ({
          value: unit.unitName,
          label: unit.unitName
        })));
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleInputChange = (name, value, file = null) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (file) {
      setOriginalFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    
    // Append all form fields first, so server has access to productEnName
    Object.keys(formData).forEach(key => {
      if (key === 'imageUrl' && formData[key].startsWith('data:')) {
        // Handle image file separately
        const file = dataURLtoFile(formData[key], originalFile.name);
        formDataToSend.append('file', file);
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch('http://localhost:3006/api/products', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();
      
      if (data.success) {
        // Call onSubmit to update parent's state
        if (onSubmit) {
          onSubmit(data.product);
        }

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Product has been added successfully',
          showCancelButton: true,
          confirmButtonText: 'Add More Products',
          cancelButtonText: 'Return to Product List',
          reverseButtons: true
        }).then((result) => {
          if (result.isConfirmed) {
            // Clear form for new entry
            setFormData({
              productEnName: "",
              productBnName: "",
              productUnit: "kg",
              regularPrice: "",
              discountPrice: "",
              searchTag: "",
              productStatus: "Active",
              productCategory: "",
              imageUrl: ""
            });
            setOriginalFile(null);
          } else {
            // Return to product list
            onHide();
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: data.error || 'Failed to save product',
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Something went wrong while saving the product',
      });
    }
  };

  // Utility function to convert base64 to file
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCategoryModalClose = () => {
    setShowCategoryModal(false);
    fetchCategories(); // Refresh categories after adding new one
  };

  const handleUnitModalClose = () => {
    setShowUnitModal(false);
    fetchUnits(); // Refresh units after adding new one
  };


  if (!show) return null;

  return (
    <>
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Product</h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Product Name (English)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.productEnName}
                        onChange={(e) => handleInputChange("productEnName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Product Name (Bangla)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.productBnName}
                        onChange={(e) => handleInputChange("productBnName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Category</label>
                      <div className="d-flex">
                        <div className="flex-grow-1">
                          <Select
                            options={categoryOptions}
                            value={categoryOptions.find(x => x.value === formData.productCategory)}
                            onChange={(option) => handleInputChange("productCategory", option.value)}
                            required
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-primary ms-2"
                          onClick={() => setShowCategoryModal(true)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Unit</label>
                      <div className="d-flex">
                        <div className="flex-grow-1">
                          <Select
                            options={unitOptions}
                            value={unitOptions.find(x => x.value === formData.productUnit)}
                            onChange={(option) => handleInputChange("productUnit", option.value)}
                            required
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-primary ms-2"
                          onClick={() => setShowUnitModal(true)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Regular Price</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.regularPrice}
                        onChange={(e) => handleInputChange("regularPrice", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Discount Price</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.discountPrice}
                        onChange={(e) => handleInputChange("discountPrice", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        className="form-control"
                        value={formData.productStatus}
                        onChange={(e) => handleInputChange("productStatus", e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group">
                      <label>Search Tags</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Comma separated tags"
                        value={formData.searchTag}
                        onChange={(e) => handleInputChange("searchTag", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group">
                      <label>Product Image (Image ratio should 1:1. 500x500 pixels preferred)</label>                  
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              handleInputChange("imageUrl", reader.result, file);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onHide}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <AddCategory 
        show={showCategoryModal}
        onHide={handleCategoryModalClose}
      />
      <AddUnit 
        show={showUnitModal}
        onHide={handleUnitModalClose}
      />
    </>
  );
};

AddProduct.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onSubmit: PropTypes.func
};

export default AddProduct;
