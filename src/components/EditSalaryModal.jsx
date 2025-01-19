import React from 'react';
import './EditSalaryModal.css';

function EditSalaryModal({ 
  employee, 
  onSave, 
  onClose, 
  onChange,
  formData 
}) {
  return (
    <div className="edit-salary-modal">
      <div className="modal-content">
        <h2>Edit Salary Details</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}>
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={onChange}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onChange}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Base Salary</label>
            <input
              type="number"
              name="baseSalary"
              value={formData.baseSalary}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Working Days</label>
            <input
              type="number"
              name="workingDays"
              value={formData.workingDays}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Previous Advance</label>
            <input
              type="number"
              name="previousAdvance"
              value={formData.previousAdvance}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Current Advance</label>
            <input
              type="number"
              name="currentAdvance"
              value={formData.currentAdvance}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Paid Salary</label>
            <input
              type="number"
              name="paidSalary"
              value={formData.paidSalary}
              onChange={onChange}
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

export default EditSalaryModal; 