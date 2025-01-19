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
import "./Mediator.css";

function MediatorManagement() {
  const [mediators, setMediators] = useState([]);
  const [mediatorName, setMediatorName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMediator, setEditingMediator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");  // State for search query

  const fetchMediators = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "mediators"));
      const mediatorList = [];
      querySnapshot.forEach((doc) => {
        mediatorList.push({ id: doc.id, ...doc.data() });
      });
      setMediators(mediatorList);
    } catch (err) {
      console.error("Error fetching mediators:", err);
      setError("Error fetching mediators.");
    }
  };

  // Fetch account entries for mediators
  const fetchAccountEntries = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "AccountManagement"));
      const accountEntries = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === "Mediators") {
          accountEntries.push({ 
            mediatorName: data.Mediators,
            amount: data.Amount
          });
        }
      });
      setMediators((prevMediators) => [...prevMediators, ...accountEntries]);
    } catch (err) {
      console.error("Error fetching account entries:", err);
      setError("Error fetching account entries.");
    }
  };

  const saveMediator = async () => {
    if (!mediatorName || !amount || !transactionDate || !phone || !address) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      if (editingMediator) {
        const mediatorDoc = doc(db, "mediators", editingMediator.id);
        await updateDoc(mediatorDoc, {
          name: mediatorName,
          amount,
          date: transactionDate,
          phone,
          address,
        });
      } else {
        await addDoc(collection(db, "mediators"), {
          name: mediatorName,
          amount,
          date: transactionDate,
          phone,
          address,
          status: "Pending",
        });
      }

      fetchMediators();
      setIsModalOpen(false);
      clearForm();
    } catch (err) {
      console.error("Error saving mediator:", err);
      setError("Error saving mediator.");
    }
  };

  const sendMessage = async (mediator) => {
    const { id, name, amount, date, phone } = mediator;
    setLoading(true);

    try {
      const mediatorDoc = doc(db, "mediators", id);
      await updateDoc(mediatorDoc, { status: "Sent" });

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
      fetchMediators();
    }
  };

  const deleteMediator = async (id) => {
    if (window.confirm("Are you sure you want to delete this mediator?")) {
      try {
        const mediatorDoc = doc(db, "mediators", id);
        await deleteDoc(mediatorDoc);
        fetchMediators();
      } catch (err) {
        console.error("Error deleting mediator:", err);
        setError("Error deleting mediator.");
      }
    }
  };

  const clearForm = () => {
    setMediatorName("");
    setAmount("");
    setTransactionDate("");
    setPhone("");
    setAddress("");
    setEditingMediator(null);
  };

  const editMediator = (mediator) => {
    setMediatorName(mediator.name);
    setAmount(mediator.amount);
    setTransactionDate(mediator.date);
    setPhone(mediator.phone);
    setAddress(mediator.address);
    setEditingMediator(mediator);
    setIsModalOpen(true);
  };

  const addNewMediator = () => {
    clearForm();
    setIsModalOpen(true);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredMediators = mediators.filter((mediator) => {
    return (
      mediator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mediator.amount.toString().includes(searchQuery) ||
      mediator.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mediator.phone.includes(searchQuery) ||
      mediator.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  useEffect(() => {
    fetchMediators();
    fetchAccountEntries(); // Fetch account entries for Mediators
  }, []);

  return (
    <div className="mediator-management">
      <input
        type="text"
        className="search-bar"
        placeholder="Search by Name, Amount, Date, Phone, Address"
        value={searchQuery}
        onChange={handleSearch}
      />
      <button className="btn-add" onClick={addNewMediator}>
        Add Mediator
      </button>
      <div className="mediator-table-wrapper">
        <table className="mediator-table">
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
            {filteredMediators.map((mediator) => (
              <tr key={mediator.id}>
                <td>{mediator.name}</td>
                <td>₹{mediator.amount}</td>
                <td>{mediator.date}</td>
                <td>{mediator.phone}</td>
                <td>{mediator.address}</td>
                <td className={mediator.status === "Sent" ? "status-sent" : "status-pending"}>
                  {mediator.status}
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="btn-action btn-edit"
                      onClick={() => editMediator(mediator)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => deleteMediator(mediator.id)}
                    >
                      Del
                    </button>
                    <button
                      className="btn-action btn-sms"
                      onClick={() => sendMessage(mediator)}
                      disabled={loading || mediator.status === "Sent"}
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
            <h2>{editingMediator ? "Edit Mediator" : "Add Mediator"}</h2>
            <label>
              Name:
              <input
                type="text"
                value={mediatorName}
                onChange={(e) => setMediatorName(e.target.value)}
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
            <button className="btn-save" onClick={saveMediator}>
              Save
            </button>
            <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default MediatorManagement;
