import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AddUnit = ({ show, onHide, onSubmit }) => {
    const [unitName, setUnitName] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/units`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ unitName }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessage('Unit added successfully!');
                setUnitName('');
                // Safely call onSubmit if it exists
                if (typeof onSubmit === 'function') {
                    try {
                        onSubmit(data.unit);
                    } catch (error) {
                        console.error('Error in onSubmit handler:', error);
                    }
                }
                // Clear message and close modal after 2 seconds
                setTimeout(() => {
                    setMessage('');
                    onHide();
                }, 2000);
            } else {
                setMessage('Error: ' + (data.error || 'Failed to add unit'));
            }
        } catch (error) {
            setMessage('Error: Could not connect to server');
            console.error('Server connection error:', error);
        }
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h4>Create Unit</h4>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onHide}
                        />
                    </div>
                    <div className="modal-body">
                        {message && (
                            <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
                                {message}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Unit Name</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={unitName}
                                    onChange={(e) => setUnitName(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="modal-footer border-0">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onHide}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Unit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

AddUnit.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    onSubmit: PropTypes.func // Make onSubmit optional
};

export default AddUnit;
