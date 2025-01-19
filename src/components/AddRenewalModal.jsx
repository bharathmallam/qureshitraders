import React, { useState } from 'react';
import './AddRenewalModal.css';

function AddRenewalModal({ onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleNumber: '',
    renewalType: '',
    amount: '',
    dueDate: '',
    status: 'Pending'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="renewal-modal">
      <div className="modal-content">
        <h2>Add New Renewal</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Vehicle Number</label>
            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Renewal Type</label>
            <select
              name="renewalType"
              value={formData.renewalType}
              onChange={handleChange}
              required
            >
              <option value="">Select Type</option>
              <option value="Insurance">Insurance</option>
              <option value="Fitness">Fitness</option>
              <option value="Permit">Permit</option>
              <option value="Tax">Tax</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="button-group">
            <button type="submit" className="btn-save">Save</button>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRenewalModal; 