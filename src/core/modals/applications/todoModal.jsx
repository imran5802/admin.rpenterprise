import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TodoModal = ({ onAddTodo, onUpdateTodo, onDeleteTodo, selectedTodo }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    tag: 'pending',
    dueDate: new Date()
  });

  useEffect(() => {
    if (selectedTodo) {
      setFormData({
        ...selectedTodo,
        dueDate: selectedTodo.dueDate ? new Date(selectedTodo.dueDate) : new Date()
      });
    }
  }, [selectedTodo]);

  const tagOptions = [
    { value: "pending", label: "Pending" },
    { value: "onhold", label: "Onhold" },
    { value: "inprogress", label: "Inprogress" },
    { value: "done", label: "Done" }
  ];

  const priorityOptions = [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" }
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "deleted", label: "Deleted" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTodo) {
      onUpdateTodo(selectedTodo.id, formData);
    } else {
      onAddTodo(formData);
    }
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      tag: 'pending',
      dueDate: new Date()
    });
    document.getElementById('close-modal').click();
  };

  const handleDelete = () => {
    if (selectedTodo) {
      onDeleteTodo(selectedTodo.id);
      document.getElementById('close-modal').click();
    }
  };

  return (
    <div className="modal fade" id="note-units">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedTodo ? 'Edit Todo' : 'Add Todo'}
            </h5>
            <button
              id="close-modal"
              type="button"
              className="close"
              data-bs-dismiss="modal"
            >
              <span>&times;</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Tag</label>
                <Select
                  value={tagOptions.find(option => option.value === formData.tag)}
                  onChange={(option) => setFormData({...formData, tag: option.value})}
                  options={tagOptions}
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <Select
                  value={priorityOptions.find(option => option.value === formData.priority)}
                  onChange={(option) => setFormData({...formData, priority: option.value})}
                  options={priorityOptions}
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <DatePicker
                  selected={formData.dueDate}
                  onChange={(date) => setFormData({...formData, dueDate: date})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <Select
                  value={statusOptions.find(option => option.value === formData.status)}
                  onChange={(option) => setFormData({...formData, status: option.value})}
                  options={statusOptions}
                />
              </div>
            </div>
            <div className="modal-footer">
              {selectedTodo && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                {selectedTodo ? 'Update' : 'Add'} Todo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

TodoModal.propTypes = {
  onAddTodo: PropTypes.func.isRequired,
  onUpdateTodo: PropTypes.func.isRequired,
  onDeleteTodo: PropTypes.func.isRequired,
  selectedTodo: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['pending', 'completed', 'deleted']),
    priority: PropTypes.oneOf(['high', 'medium', 'low']),
    tag: PropTypes.oneOf(['pending', 'onhold', 'inprogress', 'done']),
    dueDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date)
    ])
  })
};

TodoModal.defaultProps = {
  selectedTodo: null
};

export default TodoModal;
