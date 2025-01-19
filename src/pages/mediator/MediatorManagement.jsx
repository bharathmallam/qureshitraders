import React, { useState, useEffect } from 'react';
import './MediatorManagement.css';
import '../../styles/actionButtons.css';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function MediatorManagement() {
  // ... your existing state and functions

  const sendMessage = async (mediator) => {
    const { id, phone, name, amount } = mediator;
    setLoading(true);
    setError("");

    try {
      const mediatorDoc = doc(db, "mediators", id);
      await updateDoc(mediatorDoc, { status: "Sent" });

      const params = new URLSearchParams({
        phone,
        name,
        amount,
        date: new Date().toISOString().split('T')[0]
      });

      // Use the actual Cloud Function URL from deployment
      const functionUrl = "https://sendsms-fqvpdrafqa-uc.a.run.app";
      const response = await fetch(
        `${functionUrl}?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to send SMS");
      }

      setError("Message sent successfully!");
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message: " + (err.message || "Please try again"));
      const mediatorDoc = doc(db, "mediators", id);
      await updateDoc(mediatorDoc, { status: "Pending" });
    } finally {
      setLoading(false);
      fetchMediators();
    }
  };

  return (
    <div className="mediator-management">
      <h2>Mediator Management</h2>
      
      {/* Controls Section */}
      <div className="controls-section">
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          Add Mediator
        </button>
      </div>

      {/* Table Section */}
      <div className="mediator-table-wrapper">
        <table className="mediator-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mediators.map((mediator) => (
              <tr key={mediator.id}>
                <td>{mediator.name}</td>
                <td>{mediator.phone}</td>
                <td>{mediator.address}</td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEdit(mediator)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(mediator.id)}
                    >
                      Del
                    </button>
                    <button
                      className="btn-action btn-sms"
                      onClick={() => handleSendMessage(mediator)}
                      disabled={mediator.status === "Sent"}
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
        <AddMediatorModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSave}
          editingMediator={editingMediator}
        />
      )}
    </div>
  );
}

export default MediatorManagement; 