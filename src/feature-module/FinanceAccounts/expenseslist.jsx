import React, { useState, useEffect, useCallback } from "react";
import Breadcrumbs from "../../core/breadcrumbs";
import { Link } from "react-router-dom";
import Select from "react-select";
import { X } from "react-feather";
import { DatePicker } from "antd";
import Swal from "sweetalert2";
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

const { RangePicker } = DatePicker;

// Initialize dayjs plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

const ExpensesList = () => {
  // const onOk = (value) => {
  //   setDateRange(value);
  // };

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedDateModal, setSelectedDateModal] = useState(new Date());
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [enableDateFilter, setEnableDateFilter] = useState(false);  // Add this line
  const [editDate, setEditDate] = useState(null);

  // Move applyFilters above its usage in useEffect
  const applyFilters = useCallback(() => {
    let filtered = [...expenses];

    // Search filter
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(expense => 
        String(expense.catName || '').toLowerCase().includes(searchTerm) ||
        String(expense.reference || '').toLowerCase().includes(searchTerm) ||
        String(expense.description || '').toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(expense => 
        expense.catId === selectedCategory.value || // Match by ID
        String(expense.category) === String(selectedCategory.value) || // Match by category value
        expense.catName === selectedCategory.label // Match by category name
      );
    }

    // Date range filter - only apply if checkbox is checked
    if (enableDateFilter && dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dayjs(dateRange[0]).format('YYYY-MM-DD');
      const endDate = dayjs(dateRange[1]).format('YYYY-MM-DD');
      
      filtered = filtered.filter(expense => {
        const expenseDate = dayjs(expense.expenseDate).format('YYYY-MM-DD');
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchQuery, selectedCategory, enableDateFilter, dateRange]);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (expenses.length > 0) {
      applyFilters();
    }
  }, [dateRange, selectedCategory, searchQuery, expenses, enableDateFilter, applyFilters]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/expenses`);
      const data = await response.json();
      if (data.success) {
        const formattedExpenses = data.expenses.map(expense => ({
          ...expense,
          expenseDate: dayjs(expense.expenseDate).format('YYYY-MM-DD'),
          // Ensure catName and catId are properly set
          catName: expense.catName || expense.category,
          catId: expense.catId || parseInt(expense.category)
        }));
        setExpenses(formattedExpenses);
        setFilteredExpenses(formattedExpenses); // Initialize filtered expenses
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/expense-categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories.map(cat => ({
          value: cat.id,
          label: cat.name
        })));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddExpense = async (expenseData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      const data = await response.json();
      if (data.success) {
        fetchExpenses(); // Refresh the list
        // Show Toast
        Swal.fire({
          icon: 'success',
          title: 'Expense added successfully!',
          showConfirmButton: false,
          timer: 1500
        });
        // Close modal
        document.querySelector('[data-bs-dismiss="modal"]').click();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleEditExpense = async (id, updates) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.success) {
        fetchExpenses(); // Refresh the list
        // Close modal
        document.querySelector('[data-bs-dismiss="modal"]').click();
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/expenses/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchExpenses(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };
  const handleDateChangeModal = (date) => {
    setSelectedDateModal(date);
  };
  const confirmText = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteExpense(id);
      }
    });
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
    } else {
      setDateRange(null);
    }
  };

  // Add this new function to calculate totals
  const calculateTotals = () => {
    return {
      totalAmount: filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    };
  };

  const renderExpenseRows = () => {
    const expensesToRender = filteredExpenses;

    return expensesToRender.map((expense) => (
      <tr key={expense.id}>
        <td>{expense.catName}</td>
        <td>{expense.reference}</td>
        <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
        <td>
          <span className={`badge badge-line${expense.status === 'Active' ? 'success' : 'danger'}`}>
            {expense.status}
          </span>
        </td>
        <td>{expense.amount}</td>
        <td>{expense.description}</td>
        <td>
          <div>
            {/* <Link
              className="me-2 p-2 mb-0"
              disabled
              onClick={() => {
                const categoryOption = categories.find(cat => cat.label === expense.catName);
                setEditDate(dayjs(expense.expenseDate));
                setSelectedExpense({
                  ...expense,
                  category: categoryOption
                });
              }}
              data-bs-toggle="modal"
              data-bs-target="#edit-units"
            >
              <i data-feather="edit" className="feather-edit" />
            </Link> */}
            <Link 
              className="me-3 confirm-text p-2 mb-0" 
              onClick={() => confirmText(expense.id)}
            >
              <i data-feather="trash-2" className="feather-trash-2" />
            </Link>
          </div>
        </td>
      </tr>
    ));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const expenseData = {
      category: formData.get('category'),
      amount: formData.get('amount'),
      reference: formData.get('reference'),
      expenseFor: formData.get('expenseFor'),
      description: formData.get('description'),
      expenseDate: formData.get('expenseDate'),
    };
    // Check for empty amount, date and category
    if (!expenseData.amount || !expenseData.expenseDate || !expenseData.category) {
      return Swal.fire({
        icon: 'error',
        title: 'Please fill in all required fields!',
        showConfirmButton: false,
        timer: 1500
      });
    }
    handleAddExpense(expenseData);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updates = {
      category: e.target.category.value, // Get the category label
      amount: e.target.amount.value,
      reference: e.target.reference.value,
      expenseFor: e.target.expenseFor.value,
      description: e.target.description.value,
      expenseDate: editDate ? dayjs(editDate).format('YYYY-MM-DD') : null,
    };
    handleEditExpense(selectedExpense.id, updates);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/expense-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('categoryName'),
          description: formData.get('categoryDescription')
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchCategories(); // Refresh categories list
        // Close modal
        // Show Toast
        Swal.fire({
          icon: 'success',
          title: 'Category added successfully!',
          showConfirmButton: false,
          timer: 1500
        });
        document.querySelector('#add-category .btn-close').click();
        e.target.reset();
        // SHow Add Expense Modal Again
        document.querySelector('#add-units').click();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  useEffect(() => {
    return () => {
      setSelectedExpense(null);
      setEditDate(null);
    };
  }, []);

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <Breadcrumbs
            maintitle="Expense List"
            subtitle="Manage Your Expenses"
            addButton="Add New Expenses"
          />
          {/* /product list */}
          <div className="card table-list-card">
            <div className="card-body">
              <div className="table-top">
                <div className="search-set d-flex gap-3 flex-grow-1">
                  <div className="search-input d-flex">
                    <input
                      type="text"
                      placeholder="Search"
                      className="form-control"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div style={{ minWidth: '200px' }}>
                  <Select
                      options={categories}
                      value={selectedCategory}
                      onChange={setSelectedCategory}  // Remove the () here
                      isClearable
                      placeholder="Filter by Category"
                    />
                  </div>
                  <div className="position-relative d-flex align-items-center gap-2" style={{ minWidth: '300px' }}>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="enableDateFilter"
                        checked={enableDateFilter}
                        onChange={(e) => setEnableDateFilter(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="enableDateFilter">
                        Date Filter
                      </label>
                    </div>
                    <RangePicker
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      disabled={!enableDateFilter}
                      format="YYYY-MM-DD"
                      style={{ height: '40px' }}
                      allowEmpty={[true, true]}  // Add this line
                    />
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table  datanew">
                  <thead>
                    <tr>
                      <th>Category name</th>
                      <th>Reference</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th className="no-sort">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7">Loading...</td></tr>
                    ) : (
                      renderExpenseRows()
                    )}
                  </tbody>
                  <tfoot className="border-top">
                    <tr>
                      <td colSpan="4" className="text-end">
                        <strong>Total Amount =</strong>
                      </td>
                      <td colSpan="3">
                        {calculateTotals().totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
      </div>
      {/* Add Expense */}
      <div className="modal fade" id="add-units" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered custom-modal-two">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Add Expense</h4>
                    <button
                      type="button"
                      className="btn-close position-absolute"
                      style={{ right: '20px', top: '20px' }}
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
                          <label className="form-label">Expense Category</label>
                          <div className="d-flex gap-2">
                            <div style={{ flex: 1 }}>
                              <Select
                                options={categories}
                                placeholder="Choose"
                                name="category"
                              />
                            </div>
                            <button 
                              type="button" 
                              className="btn btn-primary"
                              data-bs-toggle="modal"
                              data-bs-target="#add-category"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="input-blocks date-group">
                          <i data-feather="calendar" className="info-img" />
                          <div className="input-groupicon">
                            <DatePicker                              
                              selected={selectedDateModal}
                              onChange={handleDateChangeModal}
                              dateFormat="dd/MM/yyyy"
                              placeholderText="Choose Date"
                              className="datetimepicker"
                              name="expenseDate"
                              getPopupContainer={(triggerNode) => {
                                return triggerNode.parentNode;
                              }}
                              style={{ width: '100%', height: '40px' }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">Amount</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="৳"
                            name="amount"
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">Reference</label>
                          <input type="text" className="form-control" name="reference" />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">Expense For</label>
                          <input type="text" className="form-control" name="expenseFor" />
                        </div>
                      </div>
                      {/* Editor */}
                      <div className="col-md-12">
                        <div className="edit-add card">
                          <div className="edit-add">
                            <label className="form-label">Description</label>
                          </div>
                          <div className="card-body-list input-blocks mb-0">
                            <textarea
                              className="form-control"
                              name="description"
                              defaultValue={""}
                            />
                          </div>
                          <p>Maximum 600 Characters</p>
                        </div>
                      </div>
                      {/* /Editor */}
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

      {/* Edit Expense */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered custom-modal-two">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Edit Expense</h4>
                    <button
                      type="button"
                      className="btn-close position-absolute"
                      style={{ right: '20px', top: '20px' }}
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    >
                      <X className="info-img" />
                    </button>
                  </div>
                </div>
                <div className="modal-body custom-modal-body">
                  <form onSubmit={handleEditSubmit}>
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">Expense Category</label>
                          <Select
                            options={categories}
                            value={selectedExpense?.category}
                            onChange={(selected) => {
                              setSelectedExpense({
                                ...selectedExpense,
                                category: selected
                              });
                            }}
                            name="category"
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="input-blocks date-group">
                          <i data-feather="calendar" className="info-img" />
                          <div className="input-groupicon">
                            <DatePicker
                              value={editDate}
                              onChange={(date) => setEditDate(date)}
                              format="YYYY-MM-DD"
                              className="form-control"
                              name="expenseDate"
                              getPopupContainer={(triggerNode) => {
                                return triggerNode.parentNode;
                              }}
                              style={{ width: '100%', height: '40px' }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">Amount</label>
                          <input
                            type="text"
                            className="form-control"
                            defaultValue={selectedExpense?.amount}
                            name="amount"
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">Reference</label>
                          <input
                            type="text"
                            className="form-control"
                            defaultValue={selectedExpense?.reference}
                            name="reference"
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">Expense For</label>
                          <input
                            type="text"
                            className="form-control"
                            name="expenseFor"
                            defaultValue={selectedExpense?.expenseFor}
                          />
                        </div>
                      </div>
                      {/* Editor */}
                      <div className="col-md-12">
                        <div className="edit-add card">
                          <div className="edit-add">
                            <label className="form-label">Description</label>
                          </div>
                          <div className="card-body-list input-blocks mb-0">
                            <textarea
                              className="form-control"
                              defaultValue={selectedExpense?.description}
                              name="description"
                            />
                          </div>
                          <p>Maximum 600 Characters</p>
                        </div>
                      </div>
                      {/* /Editor */}
                    </div>
                    <div className="modal-footer-btn">
                      <button
                        type="button"
                        className="btn btn-cancel me-2"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-submit">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Edit Expense */}

      {/* Add Category Modal */}
      <div className="modal fade" id="add-category">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0">
              <h5 className="modal-title">Add Expense Category</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <X className="info-img" />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddCategory}>
                <div className="mb-3">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="categoryName"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="categoryDescription"
                    rows="3"
                  ></textarea>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-cancel"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Category Modal */}
    </div>
  );
};

export default ExpensesList;
