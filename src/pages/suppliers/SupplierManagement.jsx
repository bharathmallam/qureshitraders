import { db } from "../../apis/Firebase";
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import "./Supplier.css";

function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");  // State for search input
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSuppliers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "suppliers"));
      const supplierList = [];
      querySnapshot.forEach((doc) => {
        supplierList.push({ id: doc.id, ...doc.data() });
      });
      setSuppliers(supplierList);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Error fetching suppliers.");
    }
  };

  // Function to handle the search filter
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||  // Filter by name
    supplier.phone.includes(searchTerm)  // Optionally filter by phone
  );

  const saveSupplier = async () => {
    if (!recipientName || !amount || !transactionDate || !phone || !address) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      if (editingSupplier) {
        const supplierDoc = doc(db, "suppliers", editingSupplier.id);
        await updateDoc(supplierDoc, {
          name: recipientName,
          amount,
          date: transactionDate,
          phone,
          address,
        });
      } else {
        await addDoc(collection(db, "suppliers"), {
          name: recipientName,
          amount,
          date: transactionDate,
          phone,
          address,
          status: "Pending",
        });
      }

      fetchSuppliers();
      setIsModalOpen(false);
      clearForm();
    } catch (err) {
      console.error("Error saving supplier:", err);
      setError("Error saving supplier.");
    }
  };

  const sendMessage = async (supplier) => {
    const { id, name, amount, date, phone } = supplier;
    setLoading(true);

    try {
      const supplierDoc = doc(db, "suppliers", id);
      await updateDoc(supplierDoc, { status: "Sent" });

      const API_URL = `http://bhashsms.com/api/sendmsg.php?user=QureshiTraders_BW&pass=123456&sender=BUZWAP&phone=${phone}&text=transaction_alert&params=${encodeURIComponent(
        `${name},${amount},${date}`
      )}&priority=wa&stype=normal`;

      const res = await fetch(API_URL);
      const data = await res.text();

      if (!res.ok || !data.includes("success")) {
        throw new Error(data);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
      fetchSuppliers();
    }
  };

  const deleteSupplier = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        const supplierDoc = doc(db, "suppliers", id);
        await deleteDoc(supplierDoc);
        fetchSuppliers();
      } catch (err) {
        console.error("Error deleting supplier:", err);
        setError("Error deleting supplier.");
      }
    }
  };

  const clearForm = () => {
    setRecipientName("");
    setAmount("");
    setTransactionDate("");
    setPhone("");
    setAddress("");
    setEditingSupplier(null);
  };

  const editSupplier = (supplier) => {
    setRecipientName(supplier.name);
    setAmount(supplier.amount);
    setTransactionDate(supplier.date);
    setPhone(supplier.phone);
    setAddress(supplier.address);
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const addNewSupplier = () => {
    clearForm();
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <div className="supplier-management">
   
      
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search by Name or Phone"
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-bar"
      />

<button className="btn-add" onClick={addNewSupplier}>
        Add Supplier
      </button>

      <div className="supplier-table-wrapper">
        <table className="supplier-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>₹{supplier.amount}</td>
                <td>{supplier.date}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.address}</td>
                <td
                  className={supplier.status === "Sent" ? "status-sent" : "status-pending"}
                >
                  {supplier.status}
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="btn-action btn-edit"
                      onClick={() => editSupplier(supplier)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => deleteSupplier(supplier.id)}
                    >
                      Del
                    </button>
                    <button
                      className="btn-action btn-sms"
                      onClick={() => sendMessage(supplier)}
                      disabled={loading || supplier.status === "Sent"}
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

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</h2>
            <label>
              Name:
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </label>
            <label>
              Amount:
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              Date:
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </label>
            <label>
              Phone:
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <label>
              Address:
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
            <button className="btn-save" onClick={saveSupplier}>
              Save
            </button>
            <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default SupplierManagement;
