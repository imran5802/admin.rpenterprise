import React, { useState, useEffect } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import { Sliders } from "react-feather";
import Select from "react-select";
import TodoModal from "../../core/modals/applications/todoModal";
import { Link } from "react-router-dom";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { ChevronUp, RotateCcw } from "react-feather";
import { setToogleHeader } from "../../core/redux/action";
import { PlusCircle } from "react-feather";
import Content from "./content";
import axios from 'axios';
import PropTypes from 'prop-types';

// Add a helper component for the badge
const CountBadge = ({ count }) => {
  if (!count || count === 0) return null;
  return <span className="ms-2 badge bg-primary">{count}</span>;
};

const ToDo = () => {
  const [isOpen, setOpen] = useState(false);
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [counts, setCounts] = useState({
    inbox: 0,
    done: 0,
    important: 0,
    trash: 0
  });
  const dispatch = useDispatch();
  const data = useSelector((state) => state.toggle_header);

  const options = [
    { value: "sortByDate", label: "Sort by Date" },
    { value: "Ascending", label: "Ascending" },
    { value: "Descending", label: "Descending" },
    { value: "Recently Viewed", label: "Recently Viewed" },
    { value: "Recently Added", label: "Recently Added" },
    { value: "Creation Date", label: "Creation Date" },
  ];

  useEffect(() => {
    fetchTodos();
    fetchCounts();
  }, []);

  // Add useEffect to refresh counts when todos change
  useEffect(() => {
    fetchCounts();
  }, [todos]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/todos`);
      if (response.data.success) {
        setTodos(response.data.todos);
      }
    } catch (error) {
      setError('Failed to fetch todos');
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/todos/counts`);
      if (response.data.success) {
        setCounts(response.data.counts);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const handleAddTodo = async (todoData) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/todos`, todoData);
      if (response.data.success) {
        setTodos([response.data.todo, ...todos]);
        fetchCounts(); // Refresh counts
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const handleUpdateTodo = async (id, updates) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/todos/${id}`, updates);
      if (response.data.success) {
        setTodos(todos.map(todo => 
          todo.id === id ? { ...todo, ...updates } : todo
         ));
        fetchCounts(); // Refresh counts
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      // If in trash view, permanently delete
      if (filter === 'trash') {
        const response = await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/todos/${id}/permanent`);
        if (response.data.success) {
          setTodos(todos.filter(todo => todo.id !== id));
        }
      } else {
        // Otherwise move to trash
        const response = await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/todos/${id}`);
        if (response.data.success) {
          setTodos(todos.map(todo => 
            todo.id === id ? { ...todo, status: 'deleted' } : todo
          ));
        }
      }
      fetchCounts(); // Refresh counts
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleRestoreTodo = async (id) => {
    try {
      const response = await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/todos/${id}/restore`);
      if (response.data.success) {
        setTodos(todos.map(todo => 
          todo.id === id ? { ...todo, status: 'pending' } : todo
        ));
        fetchCounts(); // Refresh counts
      }
    } catch (error) {
      console.error('Error restoring todo:', error);
    }
  };

  const handleSort = (option) => {
    if (!option) return;
    
    const sorted = [...todos];
    switch (option.value) {
      case 'sortByDate':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'Ascending':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'Descending':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'Recently Viewed':
        // Implement recently viewed logic if needed
        break;
      case 'Recently Added':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'Creation Date':
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        break;
    }
    setTodos(sorted);
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'done':
        return todo.status === 'completed';
      case 'important':
        return todo.isImportant;
      case 'trash':
        return todo.status === 'deleted';
      case 'all':
        return todo.status !== 'deleted';
      default:
        return false;
    }
  });

  const handleEditTodo = (todo) => {
    setSelectedTodo(todo);
  };

  const handleToggleImportant = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      try {
        // Convert boolean to 0/1 for MySQL
        await handleUpdateTodo(id, { 
          isImportant: !todo.isImportant ? 1 : 0
        });
      } catch (error) {
        console.error('Error toggling important:', error);
      }
    }
  };

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
    // <div className="page-wrapper notes-page-wrapper notes-tag-left">
    <div
      className={`page-wrapper notes-page-wrapper ${
        isOpen && "notes-tag-left"
      }`}
    >
      <div className="content">
        <div className="page-header page-add-notes">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Todo</h4>
              <h6>Manage your tasks</h6>
            </div>
            <Link
              id="toggle_btn2"
              className="notes-tog"
              to="#"
              onClick={() => setOpen(!isOpen)}
            >
              <i className="fas fa-chevron-left" />
            </Link>
          </div>
          <div className="d-flex flex-sm-row flex-column align-items-sm-center align-items-start">
            <div className="form-sort me-2 mb-sm-0 mb-3 stylewidth">
              <Sliders className="info-img" />
              <Select
                className="select"
                options={options}
                placeholder="Sort by Date"
                onChange={handleSort}
              />
            </div>
            <ul className="table-top-head">
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
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-added"
                data-bs-toggle="modal"
                data-bs-target="#note-units"
              >
                <PlusCircle className="me-2" /> Add Task{" "}
              </Link>
            </div>
          </div>
        </div>
        <div className="row">
          <div
            className={`col-xl-3 col-md-12 sidebars-right theiaStickySidebar section-bulk-widget  ${
              isOpen && "section-notes-dashboard"
            }`}
          >
            <div className="notes-dash">
              <div className="notes-top-head">
                <h5>
                  {" "}
                  <i
                    data-feather="file-text"
                    className="feather-file-text me-1"
                  />
                  Todo List
                </h5>
              </div>
              <div className="notes-top-head-submenu">
                <div
                  className="nav flex-column nav-pills todo-inbox"
                  id="v-pills-tab"
                  role="tablist"
                  aria-orientation="vertical"
                >
                  <button
                    className={`nav-link todo-tab todo-inbox ${filter === 'all' ? 'active' : ''}`}
                    id="v-pills-profile-tab"
                    data-bs-toggle="pill"
                    data-bs-target="#v-pills-profile"
                    type="button"
                    role="tab"
                    aria-controls="v-pills-profile"
                    aria-selected="true"
                    onClick={() => setFilter('all')}
                  >
                    {" "}
                    <i data-feather="inbox" className="feather-inbox me-2" />
                    Inbox <CountBadge count={counts.inbox} />
                  </button>
                  <button
                    className={`nav-link todo-tab todo-inbox ${filter === 'done' ? 'active' : ''}`}
                    id="v-pills-home-tab"
                    data-bs-toggle="pill"
                    data-bs-target="#v-pills-home"
                    type="button"
                    role="tab"
                    aria-controls="v-pills-home"
                    aria-selected="false"
                    onClick={() => setFilter('done')}
                  >
                    {" "}
                    <i
                      data-feather="check-circle"
                      className="feather-check-circle me-2"
                    />
                    Done <CountBadge count={counts.done} />
                  </button>
                  <button
                    className={`nav-link todo-tab-btn todo-inbox ${filter === 'important' ? 'active' : ''}`}
                    id="v-pills-messages-tab"
                    data-bs-toggle="pill"
                    data-bs-target="#v-pills-messages"
                    type="button"
                    role="tab"
                    aria-controls="v-pills-messages"
                    aria-selected="false"
                    onClick={() => setFilter('important')}
                  >
                    {" "}
                    <i data-feather="star" className="feather-star me-2" />
                    Important <CountBadge count={counts.important} />
                  </button>
                  <button
                    className={`nav-link todo-tab todo-inbox mb-0 ${filter === 'trash' ? 'active' : ''}`}
                    id="v-pills-settings-tab"
                    data-bs-toggle="pill"
                    data-bs-target="#v-pills-settings"
                    type="button"
                    role="tab"
                    aria-controls="v-pills-settings"
                    aria-selected="false"
                    onClick={() => setFilter('trash')}
                  >
                    {" "}
                    <i
                      data-feather="trash-2"
                      className="feather-trash-2 me-2"
                    />
                    Trash <CountBadge count={counts.trash} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`col-xl-9 budget-role-notes  ${
              isOpen && "budgeted-role-notes"
            }`}
          >
            {loading ? (
              <div className="text-center p-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger m-4" role="alert">
                {error}
              </div>
            ) : (
              isOpen ? (
                <Content 
                  todos={filteredTodos}
                  onEditTodo={handleEditTodo}
                  onDeleteTodo={handleDeleteTodo}
                  onRestoreTodo={handleRestoreTodo}
                  onToggleImportant={handleToggleImportant}
                  isTrashView={filter === 'trash'}
                />
              ) : (
                <Scrollbars>
                  <Content 
                    todos={filteredTodos}
                    onEditTodo={handleEditTodo}
                    onDeleteTodo={handleDeleteTodo}
                    onRestoreTodo={handleRestoreTodo}
                    onToggleImportant={handleToggleImportant}
                    isTrashView={filter === 'trash'}
                  />
                </Scrollbars>
              )
            )}
          </div>
        </div>
        <TodoModal 
          onAddTodo={handleAddTodo}
          onUpdateTodo={handleUpdateTodo}
          onDeleteTodo={handleDeleteTodo}
          selectedTodo={selectedTodo}
        />
      </div>
    </div>
  );
};

CountBadge.propTypes = {
  count: PropTypes.number
};

export default ToDo;
