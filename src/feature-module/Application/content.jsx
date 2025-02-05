import React from 'react';
import PropTypes from 'prop-types';
import { Star, Edit, Trash2, RefreshCw } from 'react-feather';

const Content = ({ 
  todos, 
  onEditTodo, 
  onDeleteTodo, 
  onRestoreTodo,
  onToggleImportant, 
  isTrashView 
}) => {
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getTagClass = (tag) => {
    switch(tag) {
      case 'pending': return 'bg-warning';
      case 'onhold': return 'bg-danger';
      case 'inprogress': return 'bg-info';
      case 'done': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="todo-list">
      {todos.length === 0 ? (
        <div className="text-center p-4">
          <p>No todos found</p>
        </div>
      ) : (
        todos.map(todo => (
          <div key={todo.id} className="todo-item p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className={todo.status === 'completed' ? 'text-muted text-decoration-line-through' : ''}>
                  {todo.title}
                </h5>
                <p className="text-muted mb-0">{todo.description}</p>
                <div className="mt-2">
                  <span className={`badge ${getPriorityClass(todo.priority)} me-2`}>
                    {todo.priority}
                  </span>
                  <span className={`badge ${getTagClass(todo.tag)} me-2`}>
                    {todo.tag}
                  </span>
                  <small className="text-muted">
                    Due: {new Date(todo.dueDate).toLocaleDateString()}
                  </small>
                </div>
              </div>
              <div className="d-flex">
                {isTrashView ? (
                  <>
                    <button 
                      className="btn btn-link text-success"
                      onClick={() => onRestoreTodo(todo.id)}
                      title="Restore"
                    >
                      <RefreshCw />
                    </button>
                    <button 
                      className="btn btn-link text-danger"
                      onClick={() => onDeleteTodo(todo.id)}
                      title="Delete Permanently"
                    >
                      <Trash2 />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn btn-link"
                      onClick={() => onToggleImportant(todo.id)}
                    >
                      <Star className={todo.isImportant ? 'text-warning' : ''} />
                    </button>
                    <button 
                      className="btn btn-link"
                      onClick={() => onEditTodo(todo)}
                      data-bs-toggle="modal"
                      data-bs-target="#note-units"
                    >
                      <Edit />
                    </button>
                    <button 
                      className="btn btn-link text-danger"
                      onClick={() => onDeleteTodo(todo.id)}
                      title="Move to Trash"
                    >
                      <Trash2 />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

Content.propTypes = {
  todos: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['pending', 'completed', 'deleted']),
    priority: PropTypes.string,
    tag: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    isImportant: PropTypes.bool
  })).isRequired,
  onEditTodo: PropTypes.func.isRequired,
  onDeleteTodo: PropTypes.func.isRequired,
  onRestoreTodo: PropTypes.func.isRequired,
  onToggleImportant: PropTypes.func.isRequired,
  isTrashView: PropTypes.bool.isRequired
};

export default Content;
