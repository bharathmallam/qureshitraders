import React, { useState, useEffect } from 'react';
import { db } from "../../apis/Firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import './Renewals.css';  // Updated CSS import
import '../../styles/buttons.css';

function RenewalsManagement() {
  const [showModal, setShowModal] = useState(false);
  const [renewals, setRenewals] = useState([]);
  const [searchMonth, setSearchMonth] = useState('');
  const [searchYear, setSearchYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleNumber: '',
    renewalType: '',
    amount: '',
    dueDate: '',
    status: 'Pending'
  });
  const [editingRenewal, setEditingRenewal] = useState(null);

  // Generate array of months for dropdown
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate array of years
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 7 }, 
    (_, i) => currentYear - 1 + i
  );

  const fetchRenewals = async () => {
    try {
      if (!searchMonth || !searchYear) return;

      const monthIndex = months.indexOf(searchMonth);
      const startDate = `${searchYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      const endDate = `${searchYear}-${String(monthIndex + 1).padStart(2, '0')}-31`;

      const renewalsRef = collection(db, "renewals");
      const q = query(
        renewalsRef,
        where("dueDate", ">=", startDate),
        where("dueDate", "<=", endDate)
      );

      const querySnapshot = await getDocs(q);
      const renewalsList = [];
      querySnapshot.forEach((doc) => {
        renewalsList.push({ id: doc.id, ...doc.data() });
      });
      setRenewals(renewalsList);
    } catch (error) {
      console.error("Error fetching renewals:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newRenewal = {
        ...formData,
        amount: parseFloat(formData.amount),
        timestamp: new Date().toISOString(),
        dueDate: formData.dueDate,
        status: 'Pending'
      };

      if (editingRenewal) {
        await updateDoc(doc(db, "renewals", editingRenewal.id), newRenewal);
      } else {
        await addDoc(collection(db, "renewals"), newRenewal);
      }

      setShowModal(false);
      setEditingRenewal(null);
      setFormData({
        name: '',
        phone: '',
        vehicleNumber: '',
        renewalType: '',
        amount: '',
        dueDate: '',
        status: 'Pending'
      });

      const dueDate = new Date(formData.dueDate);
      const dueMonth = months[dueDate.getMonth()];
      const dueYear = dueDate.getFullYear();

      setSearchMonth(dueMonth);
      setSearchYear(dueYear);
      await fetchRenewals();

    } catch (error) {
      console.error("Error saving renewal:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this renewal?')) {
      try {
        await deleteDoc(doc(db, "renewals", id));
        await fetchRenewals();
      } catch (error) {
        console.error("Error deleting renewal:", error);
      }
    }
  };

  const handleEdit = (renewal) => {
    setEditingRenewal(renewal);
    setFormData({
      name: renewal.name,
      phone: renewal.phone,
      vehicleNumber: renewal.vehicleNumber,
      renewalType: renewal.renewalType,
      amount: renewal.amount.toString(),
      dueDate: renewal.dueDate,
      status: renewal.status
    });
    setShowModal(true);
  };

  useEffect(() => {
    const today = new Date();
    setSearchMonth(months[today.getMonth()]);
    setSearchYear(today.getFullYear());
  }, []);

  useEffect(() => {
    if (searchMonth && searchYear) {
      fetchRenewals();
    }
  }, [searchMonth, searchYear]);

  const modalTitle = editingRenewal ? "Edit Renewal" : "Add New Renewal";
  const submitButtonText = editingRenewal ? "Update Renewal" : "Add Renewal";

  return (
    <div className="renewals-page">
      <div className="search-container">
        <div className="search-controls">
          <select 
            value={searchMonth} 
            onChange={(e) => setSearchMonth(e.target.value)}
            className="month-select"
          >
            <option value="">Select Month</option>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>

          <select 
            value={searchYear} 
            onChange={(e) => setSearchYear(Number(e.target.value))}
            className="year-select"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <button 
            className="btn-primary add-renewal-btn"
            onClick={() => setShowModal(true)}
          >
            Add Renewal
          </button>
        </div>
      </div>

      <div className="renewals-table-container">
        <table className="renewals-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Vehicle Number</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {renewals.map((renewal) => (
              <tr key={renewal.id}>
                <td>{renewal.name}</td>
                <td>{renewal.phone}</td>
                <td>{renewal.vehicleNumber}</td>
                <td>{renewal.renewalType}</td>
                <td>₹{renewal.amount}</td>
                <td>{renewal.dueDate}</td>
                <td>{renewal.status}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-action btn-edit"
                      onClick={() => handleEdit(renewal)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(renewal.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{modalTitle}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setEditingRenewal(null);
                  setFormData({
                    name: '',
                    phone: '',
                    vehicleNumber: '',
                    renewalType: '',
                    amount: '',
                    dueDate: '',
                    status: 'Pending'
                  });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Renewal Type</label>
                  <select
                    value={formData.renewalType}
                    onChange={(e) => setFormData({...formData, renewalType: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Permit">Permit</option>
                    <option value="Tax">Tax</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-primary">
                  {submitButtonText}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRenewal(null);
                    setFormData({
                      name: '',
                      phone: '',
                      vehicleNumber: '',
                      renewalType: '',
                      amount: '',
                      dueDate: '',
                      status: 'Pending'
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RenewalsManagement; 