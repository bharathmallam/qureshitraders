import React, { useState, useEffect } from "react";
import {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,doc,updateDoc,
} from "../../apis/Firebase"; // Assuming Firebase config is handled in the api
import "./AccountManagement.css"; // You can customize your styling here

function AccountManagement() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Default to today
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    sender: "",
    paymentType: "",
    receiverType: "",
    receiver: "",
    reason: "",
    amount: "",
    phone: "",
    date: new Date().toISOString().split("T")[0], // Default to today
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receivers, setReceivers] = useState([]);
  const [error, setError] = useState("");
  const [missingFields, setMissingFields] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // For search query input
const [loading, setLoading] = useState(false);
const [editingEntries, setEditingEntries] = useState(null);

  // Fetch entries for the selected date
  const fetchEntries = async () => {
    try {
      const q = query(
        collection(db, "accounts"),
        where("date", "==", date)
      );
      const querySnapshot = await getDocs(q);
      const fetchedEntries = [];
      querySnapshot.forEach((doc) => {
        fetchedEntries.push({ id: doc.id, ...doc.data() });
      });
      setEntries(fetchedEntries);
    } catch (err) {
      console.error("Error fetching entries:", err);
      setError("Error fetching entries.");
    }
  };

  // Fetch receivers based on the selected receiver type
  const fetchReceivers = async (type) => {
    try {
      const q = query(collection(db, type.toLowerCase()));
      const querySnapshot = await getDocs(q);
      const fetchedReceivers = [];
      querySnapshot.forEach((doc) => {
        fetchedReceivers.push({ id: doc.id, ...doc.data() });
      });
      setReceivers(fetchedReceivers);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(`Error fetching ${type}.`);
    }
  };

  // Fetch the receiver details (name and phone) after receiver is selected
  const fetchReceiverDetails = async (receiverName) => {
    if (!receiverName) return;

    try {
      const q = query(collection(db, formData.receiverType.toLowerCase()), where("name", "==", receiverName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const receiverDoc = querySnapshot.docs[0];
        setFormData({
          ...formData,
          phone: receiverDoc.data().phone || "", // Update phone if available
        });
      }
    } catch (err) {
      console.error("Error fetching receiver details:", err);
      setError("Error fetching receiver details.");
    }
  };

  // Save a new account entry
  const saveEntry = async () => {
    const { sender, paymentType, receiverType, receiver, reason, amount, phone, date } = formData;

    // Validate form fields and collect missing fields
    const missing = [];
    if (!sender) missing.push("Sender");
    if (!paymentType) missing.push("Payment Type");
    if (!receiverType || !['Employees', 'Mediators', 'Suppliers', 'Others'].includes(receiverType)) {
      missing.push("Receiver Type");
    }
    if (!reason) missing.push("Reason");
    if (!amount) missing.push("Amount");
    if (!date) missing.push("Date");
    if (receiverType !== "Others" && !receiver) missing.push("Receiver");

    if (missing.length > 0) {
      setMissingFields(missing);
      setError("Please fill in all required fields.");
      console.log("Validation failed, missing fields:", missing);
      return;
    }

    try {
      const newEntry = {
        date,
        sender,
        paymentType,
        receiverType,
        receiver,
        phone,
        reason,
        amount: parseFloat(amount),
        status: "Pending",
      };

      await addDoc(collection(db, "accounts"), newEntry);

      if (paymentType === "Payment" && receiverType !== "Others") {
        await addDoc(collection(db, receiverType.toLowerCase()), {
          name: receiver,
          phone,
          date,
          receiverType,
          receiver,
          amount: parseFloat(amount),
        });
      }

      console.log("Entry saved successfully.");
      fetchEntries();
      setIsModalOpen(false);
      clearForm();
    } catch (err) {
      console.error("Error saving entry:", err);
      setError("Error saving entry.");
    }
  };

const sendMessage = async (accounts) => {
    const { id, receiver, amount, date, phone } = accounts;
    setLoading(true);

    try {
      const accountsDoc = doc(db, "accounts", id);
      await updateDoc(accountsDoc, { status: "Sent" });

      const API_URL = `http://bhashsms.com/api/sendmsg.php?user=QureshiTraders_BW&pass=123456&sender=BUZWAP&phone=${phone}&text=transaction_alert&params=${encodeURIComponent(
        `${receiver},${amount},${date}`
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
      fetchEntries();
    }
  };

  // Clear form data
  const clearForm = () => {
    setFormData({
      sender: "",
      paymentType: "",
      receiverType: "",
      receiver: "",
      reason: "",
      amount: "",
      phone: "",
      date: new Date().toISOString().split("T")[0], // Reset to today
    });
    setReceivers([]);
    setMissingFields([]);
  };

  // Handle receiver type change
  const handleReceiverTypeChange = (type) => {
    setFormData({ ...formData, receiverType: type });
    if (type === "Others") {
      setReceivers([]);
    } else {
      fetchReceivers(type);
    }
  };

  // Filter entries based on the search query
  const filteredEntries = entries.filter(
    (entry) =>
      entry.receiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.phone.includes(searchQuery)
  );

  useEffect(() => {
    fetchEntries();
  }, [date]);

  useEffect(() => {
    fetchReceiverDetails(formData.receiver);
  }, [formData.receiver]);

  return (
    <div className="account-management">
      <h1>Account Management</h1>

      {/* Calendar */}
      <div className="calendar-container">
        <label htmlFor="date">Select Date:</label>
        <input
          type="date"
          id="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <label htmlFor="search">Search by Name or Phone:</label>
        <input
          type="text"
          id="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Add Entry Button */}
      <button className="btn-add" onClick={() => setIsModalOpen(true)}>
        Add Entry
      </button>

      {/* Entries Table */}
      <div className="entries-table-wrapper">
        <table className="entries-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Phone</th>
              <th>Payment Type</th>
              <th>Reason</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.date}</td>
                <td>{entry.sender}</td>
                <td>{entry.receiver}</td>
                <td>{entry.phone || "N/A"}</td>
                <td>{entry.paymentType}</td>
                <td>{entry.reason}</td>
                <td>₹{entry.amount}</td>
                <td className={entry.status === "Sent" ? "status-sent" : "status-pending"}>
                  {entry.status}
                </td>
                <td>
                <button
                    className="btn-send"
                    onClick={() => sendMessage(entry)}
                    disabled={loading || entry.status === "Sent"}
                  >
                    {loading && entry.id === editingEntries?.id ? "Sending..." : "Send Message"}
                  </button>
                  <button className="btn-edit">Edit</button>
                  <button className="btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Entry Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add New Entry</h2>
            {/* Form fields */}
            <label>
              Date:
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </label>
            <label>
              Sender:
              <select
                value={formData.sender}
                onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
              >
                <option value="">Select</option>
                <option value="Sameer">Sameer</option>
                <option value="Jafer">Jafer</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Payment Type:
              <select
                value={formData.paymentType}
                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              >
                <option value="">Select</option>
                <option value="Payment">Payment</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </label>
            <label>
              Receiver Type:
              <select
                value={formData.receiverType}
                onChange={(e) => handleReceiverTypeChange(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Employees">Employees</option>
                <option value="Mediators">Mediators</option>
                <option value="Suppliers">Suppliers</option>
                <option value="Others">Others</option>
              </select>
            </label>
            {formData.receiverType !== "Others" && (
              <label>
                Receiver:
                <select
                  value={formData.receiver}
                  onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                >
                  <option value="">Select</option>
                  {receivers.map((receiver) => (
                    <option key={receiver.id} value={receiver.name}>
                      {receiver.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Reason:
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </label>
            <label>
              Amount:
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </label>
            <label>
              Phone:
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </label>

            <button onClick={saveEntry}>Save</button>
            <button onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountManagement;


import { db, collection, getDocs, addDoc, query, where, updateDoc, doc, deleteDoc } from "../../apis/Firebase";
import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "./AccountManagement.css";

const AccountManagement = () => {
  const [accountEntries, setAccountEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    date: "",
    sender: "",
    payment_type: "",
    receiver_type: "",
    receiver: "",
    receiver_phone: "",
    reason: "",
    amount: "",
    status: "Pending",
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddEntryDialog, setShowAddEntryDialog] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [mediators, setMediators] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [receiverDetails, setReceiverDetails] = useState([]);

  // Fetch account entries based on the selected date
  const fetchAccountEntries = async (selectedDate) => {
    const accountRef = collection(db, "account_entries");
    const selectedDateStr = selectedDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    const q = query(accountRef, where("date", "==", selectedDateStr));
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map((doc) => doc.data());
    setAccountEntries(entries);
  };

  // Fetch employees from Firebase
  const fetchEmployees = async () => {
    const employeeRef = collection(db, "employees");
    const querySnapshot = await getDocs(employeeRef);
    const employeesData = querySnapshot.docs.map((doc) => ({
      name: doc.data().name,
      phone: doc.data().phone,
    }));
    setEmployees(employeesData);
  };

  // Fetch mediators from Firebase
  const fetchMediators = async () => {
    const mediatorRef = collection(db, "mediators");
    const querySnapshot = await getDocs(mediatorRef);
    const mediatorsData = querySnapshot.docs.map((doc) => ({
      name: doc.data().name,
      phone: doc.data().phone,
    }));
    setMediators(mediatorsData);
  };

  // Fetch suppliers from Firebase
  const fetchSuppliers = async () => {
    const supplierRef = collection(db, "suppliers");
    const querySnapshot = await getDocs(supplierRef);
    const suppliersData = querySnapshot.docs.map((doc) => ({
      name: doc.data().name,
      phone: doc.data().phone,
    }));
    setSuppliers(suppliersData);
  };

  // Handle adding new entry
  const handleAddEntry = async () => {
    const { date, sender, payment_type, receiver, receiver_phone, reason, amount, status } = newEntry;
    if (!date || !sender || !payment_type || !receiver || !reason || !amount) {
      alert("Please fill all fields.");
      return;
    }

    await addDoc(collection(db, "account_entries"), {
      date,
      sender,
      payment_type,
      receiver,
      receiver_phone,
      reason,
      amount: parseFloat(amount),
      status,
    });

    setShowAddEntryDialog(false);
    setNewEntry({
      date: "",
      sender: "",
      payment_type: "",
      receiver_type: "",
      receiver: "",
      receiver_phone: "",
      reason: "",
      amount: "",
      status: "Pending",
    });

    fetchAccountEntries(selectedDate);
  };

  // Generate Day Book PDF
  const closeDayBook = () => {
    const doc = new jsPDF();
    doc.text(`Day Book for ${selectedDate.toLocaleDateString()}`, 14, 10);
    const headers = ["Date", "Sender", "Receiver", "Phone", "Payment Type", "Reason", "Amount", "Status"];
    const rows = accountEntries.map((entry) => [
      new Date(entry.date).toLocaleDateString("en-GB"),
      entry.sender,
      entry.receiver,
      entry.receiver_phone,
      entry.payment_type,
      entry.reason,
      entry.amount,
      entry.status,
    ]);
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 20,
      theme: "grid",
    });
    doc.save(`DayBook_${selectedDate.toISOString().split("T")[0]}.pdf`);
  };

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
    fetchAccountEntries(newDate);
  };

  // Handle receiver type selection
  const handleReceiverTypeChange = (type) => {
    setNewEntry({ ...newEntry, receiver_type: type, receiver: "", receiver_phone: "" });
    if (type === "Employees") {
      setReceiverDetails(employees);
    } else if (type === "Mediators") {
      setReceiverDetails(mediators);
    } else if (type === "Suppliers") {
      setReceiverDetails(suppliers);
    } else if (type === "Others") {
      setReceiverDetails([]);
    }
  };

  // Handle receiver change
  const handleReceiverChange = (receiverName) => {
    if (newEntry.receiver_type === "Others") {
      setNewEntry({ ...newEntry, receiver: receiverName, receiver_phone: "" });
    } else {
      const selectedReceiver = receiverDetails.find((detail) => detail.name === receiverName);
      setNewEntry({
        ...newEntry,
        receiver: receiverName,
        receiver_phone: selectedReceiver ? selectedReceiver.phone : "",
      });
    }
  };

  // Send message and update status to Sent
 // Send message and update status to Sent
 const sendMessage = async (entry) => {
  try {
    const API_URL = `http://bhashsms.com/api/sendmsg.php?user=QureshiTraders_BW&pass=123456&sender=BUZWAP&phone=${entry.receiver_phone}&text=transaction_alert&params=${encodeURIComponent(
      `${entry.receiver}, ${entry.amount}, ${entry.date}`
    )}&priority=wa&stype=normal`;

    // Call the SMS API
    const res = await fetch(API_URL);
    const data = await res.text();

    // Check if the response indicates success
    if (!res.ok || !data.includes("success")) {
      throw new Error(data);
    }

    // If SMS is sent successfully, update the status to 'Sent' in Firestore
    const accountRef = doc(db, "account_entries", entry.id);
    await updateDoc(accountRef, { status: "Sent" });

    // Refresh the entries to reflect the changes
    fetchAccountEntries(selectedDate);
  } catch (error) {
    console.error("SMS API Error:", error);
  }
};



  // Edit entry
  const editEntry = (entry) => {
    setNewEntry(entry);
    setShowAddEntryDialog(true);
  };

  // Delete entry
  const deleteEntry = async (entry) => {
    const accountRef = doc(db, "account_entries", entry.id);
    await deleteDoc(accountRef);
    fetchAccountEntries(selectedDate);
  };

  useEffect(() => {
    fetchAccountEntries(selectedDate);
    fetchEmployees();
    fetchMediators();
    fetchSuppliers();
  }, [selectedDate]);

  const totalAmount = accountEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);

  return (
    <div className="Account-Management ">
      <div className="flex justify-between items-center mb-6">
        <input
          type="date"
          value={selectedDate.toISOString().split("T")[0]}
          onChange={handleDateChange}
          className="border p-2 rounded"
        />
        <button
          onClick={() => setShowAddEntryDialog(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Add Entry
        </button>
        <button
          onClick={closeDayBook}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Close Day Book (PDF)
        </button>
      </div>

      {showAddEntryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h2 className="text-lg font-bold mb-4">Add New Entry</h2>
            <div className="space-y-4">
              <input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                className="border p-2 rounded w-full"
              />
              <select
                value={newEntry.sender}
                onChange={(e) => setNewEntry({ ...newEntry, sender: e.target.value })}
                className="border p-2 rounded w-full"
              >
                <option value="">Select Sender</option>
                <option value="Jaffar">Jaffar</option>
                <option value="Sameer">Sameer</option>
                <option value="Others">Others</option>
              </select>
              <select
                value={newEntry.payment_type}
                onChange={(e) => setNewEntry({ ...newEntry, payment_type: e.target.value })}
                className="border p-2 rounded w-full"
              >
                <option value="">Select Payment Type</option>
                <option value="Miscellaneous">Miscellaneous</option>
                <option value="Payment">Payment</option>
              </select>
              <div>
                <label className="block">Receiver Type</label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleReceiverTypeChange("Employees")}
                    className="border p-2 rounded"
                  >
                    Employees
                  </button>
                  <button
                    onClick={() => handleReceiverTypeChange("Mediators")}
                    className="border p-2 rounded"
                  >
                    Mediators
                  </button>
                  <button
                    onClick={() => handleReceiverTypeChange("Suppliers")}
                    className="border p-2 rounded"
                  >
                    Suppliers
                  </button>
                  <button
                    onClick={() => handleReceiverTypeChange("Others")}
                    className="border p-2 rounded"
                  >
                    Others
                  </button>
                </div>
              </div>

              <div className="mb-4">
                {receiverDetails.length > 0 && (
                  <select
                    value={newEntry.receiver}
                    onChange={(e) => handleReceiverChange(e.target.value)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select Receiver</option>
                    {receiverDetails.map((receiver, index) => (
                      <option key={index} value={receiver.name}>
                        {receiver.name}
                      </option>
                    ))}
                  </select>
                )}
                {newEntry.receiver_type === "Others" && (
                  <input
                    type="text"
                    placeholder="Enter Receiver Name"
                    value={newEntry.receiver}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, receiver: e.target.value })
                    }
                    className="border p-2 rounded w-full mt-2"
                  />
                )}
                {newEntry.receiver && (
                  <input
                    type="text"
                    placeholder="Receiver's Phone"
                    value={newEntry.receiver_phone}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, receiver_phone: e.target.value })
                    }
                    className="border p-2 rounded w-full mt-2"
                  />
                )}
              </div>

              <input
                type="text"
                value={newEntry.reason}
                onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                placeholder="Enter Reason"
                className="border p-2 rounded w-full"
              />

              <input
                type="number"
                value={newEntry.amount}
                onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                placeholder="Amount"
                className="border p-2 rounded w-full"
              />

              <button
                onClick={handleAddEntry}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full"
              >
                Add Entry
              </button>
              <button
                onClick={() => setShowAddEntryDialog(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
<div className="employee-table-wrapper">
      <div className="mt-8 bg-gray-200  " >
        <h2 className="text-lg font-semibold mb-4">Account Entries</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Date</th>
              <th className="border p-2">Sender</th>
              <th className="border p-2">Receiver</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Payment Type</th>
              <th className="border p-2">Reason</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accountEntries.map((entry, index) => (
              <tr key={index}>
                <td className="border p-2">{new Date(entry.date).toLocaleDateString("en-GB")}</td>
                <td className="border p-2">{entry.sender}</td>
                <td className="border p-2">{entry.receiver}</td>
                <td className="border p-2">{entry.receiver_phone}</td>
                <td className="border p-2">{entry.payment_type}</td>
                <td className="border p-2">{entry.reason}</td>
                <td className="border p-2">{entry.amount}</td>
                <td className="border p-2">{entry.status}</td>
                <td className="border p-2">
                  <button
                    onClick={() => editEntry(entry)}
                   
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEntry(entry)}
                    
                  >
                    Delete
                  </button>
                  <button
  onClick={() => sendMessage(entry)}
  disabled={entry.status === "Sent"}
  className={`btn-send ${entry.status === "Sent" ? "btn-disabled" : ""}`}
>
  Send Message
</button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">Total Amount: ₹{totalAmount}</div>
      </div>
    </div>
    </div>
  );
};

export default AccountManagement;
