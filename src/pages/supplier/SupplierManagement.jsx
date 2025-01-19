import React, { useState, useEffect } from 'react';
import './SupplierManagement.css';
import '../../styles/actionButtons.css';  // Import the new CSS
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function SupplierManagement() {
  // ... your existing state and functions

  const sendMessage = async (supplier) => {
    const { id, phone, name, amount } = supplier;
    setLoading(true);
    setError("");

    try {
      const supplierDoc = doc(db, "suppliers", id);
      await updateDoc(supplierDoc, { status: "Sent" });

      // Use HTTPS URL
      const API_URL = `https://bhashsms.com/api/sendmsg.php?user=QureshiTraders_BW&pass=123456&sender=BUZWAP&phone=${phone}&text=transaction_alert&params=${encodeURIComponent(
        `${name},${amount},${new Date().toISOString().split('T')[0]}`
      )}&priority=wa&stype=normal`;

      const res = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setError("Message sent successfully!");
      setTimeout(() => setError(""), 3000);
      
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      const supplierDoc = doc(db, "suppliers", id);
      await updateDoc(supplierDoc, { status: "Pending" });
    } finally {
      setLoading(false);
      fetchSuppliers();
    }
  };

  return (
    <div className="supplier-management">
      <h2>Supplier Management</h2>
      
      {/* Controls Section */}
      <div className="controls-section">
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          Add Supplier
        </button>
      </div>

      {/* Table Section */}
      <div className="supplier-table-wrapper">
        <table className="supplier-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.address}</td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEdit(supplier)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(supplier.id)}
                    >
                      Del
                    </button>
                    <button
                      className="btn-action btn-sms"
                      onClick={() => handleSendMessage(supplier)}
                      disabled={supplier.status === "Sent"}
                    >
                      SMS
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddSupplierModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSave}
          editingSupplier={editingSupplier}
        />
      )}
    </div>
  );
}

export default SupplierManagement; 