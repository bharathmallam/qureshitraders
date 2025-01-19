import React, { useState, useEffect } from "react";
import {
  db,
  collection,
  addDoc,
  getDocs,
  query,deleteDoc,
  where,doc,updateDoc,
  serverTimestamp,
} from "../../apis/Firebase"; // Assuming Firebase config is handled in the api
import "./AccountManagement.css"; // You can customize your styling here
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/buttons.css';

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
const totalAmount = entries.reduce((sum, entries) => sum + parseFloat(entries.amount || 0), 0);
const [selectedDate, setSelectedDate] = useState(new Date());
const [showAddModal, setShowAddModal] = useState(false);

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
      if (paymentType === "Payment" && (receiverType === "Employees" || receiverType === "Mediators")) {
        try {
          // First find the receiver by name
          const receiversRef = collection(db, receiverType.toLowerCase());
          const receiverDocQuery = query(
            receiversRef,
            where("name", "==", receiver)
          );
          const querySnapshot = await getDocs(receiverDocQuery);
          
          if (!querySnapshot.empty) {
            // Update all matching documents for this receiver
            const updatePromises = querySnapshot.docs.map(async (docSnapshot) => {
              const receiverData = docSnapshot.data();
              const currentAmount = parseFloat(receiverData.amount || 0);
              const newAmount = currentAmount + parseFloat(amount);
              
              await updateDoc(doc(db, receiverType.toLowerCase(), docSnapshot.id), {
                amount: newAmount
              });
            });
            
            await Promise.all(updatePromises);
            
            // Add a new payment record
            await addDoc(collection(db, "accounts"), {
              date,
              paymentType,
              receiverType,
              receiver,
              phone,
              amount: parseFloat(amount),
              reason,
              sender,
              status: "Pending",
              timestamp: serverTimestamp()
            });
            
          } else {
            setError(`${receiverType.slice(0, -1)} not found!`);
            return;
          }
        } catch (err) {
          console.error("Error processing payment:", err);
          setError("Error processing payment.");
          return;
        }
      } else {
        // Handle other types of entries
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
          timestamp: serverTimestamp()
        };
    
        await addDoc(collection(db, "accounts"), newEntry);
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
    setError(""); // Clear any existing error

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

      // Show success message
      setError("Message sent successfully!"); // Using error state for success message
      setTimeout(() => setError(""), 3000); // Clear message after 3 seconds
      
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
      fetchEntries();
    }
  };



  // Update an existing entry
  const updateEntry = async () => {
    const { id } = editingEntries;
    const { sender, paymentType, receiverType, receiver, reason, amount, phone, date } = formData;

    try {
      const accountsDoc = doc(db, "accounts", id);
      await updateDoc(accountsDoc, {
        sender,
        paymentType,
        receiverType,
        receiver,
        reason,
        amount: parseFloat(amount),
        phone,
        date,
      });

      console.log("Entry updated successfully.");
      fetchEntries();
      setIsModalOpen(false);
      clearForm();
    } catch (err) {
      console.error("Error updating entry:", err);
      setError("Error updating entry.");
    }
  };


    // Edit an entry
    const editEntry = async (entry) => {
      setEditingEntries(entry);
      setFormData({
        ...entry,
        amount: entry.amount.toString(), // Convert to string for number input
      });
      setIsModalOpen(true);
    };
  // Delete an entry
  const deleteEntry = async (id) => {
    try {
      const accountsDoc = doc(db, "accounts", id);
      await deleteDoc(accountsDoc);

      console.log("Entry deleted successfully.");
      fetchEntries();
    } catch (err) {
      console.error("Error deleting entry:", err);
      setError("Error deleting entry.");
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
      date: new Date().toISOString().split("T")[0],
    });
    setReceivers([]);
    setMissingFields([]);
    setEditingEntries(null);  // Reset editing state
    setIsModalOpen(false);    // Close the modal
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
      (entry.date === date) &&
      entry.receiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.phone.includes(searchQuery)
  );

  useEffect(() => {
    fetchEntries();
  }, [date]);

  useEffect(() => {
    fetchReceiverDetails(formData.receiver);
  }, [formData.receiver]);

  const generateDaybookPDF = async () => {
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Qureshi Traders - Daybook Report', 15, 15);
      doc.setFontSize(12);
      doc.text(`Generated on: ${today}`, 15, 25);

      // Get the filtered entries for the current month
      const monthYear = selectedDate.toISOString().slice(0, 7);
      const accountsRef = collection(db, "accounts");
      const q = query(accountsRef, 
        where("date", ">=", `${monthYear}-01`),
        where("date", "<=", `${monthYear}-31`)
      );
      const querySnapshot = await getDocs(q);
      const entries = [];
      querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() });
      });

      // Calculate totals
      const totalPaid = entries
        .filter(t => t.paymentType === "Payment")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Format data for the table
      const tableData = entries.map(entry => [
        entry.date,
        entry.sender,
        entry.receiver,
        entry.paymentType,
        entry.reason,
        entry.paymentType === "Receipt" ? `₹${entry.amount}` : '',
        entry.paymentType === "Payment" ? `₹${entry.amount}` : '',
        entry.status
      ]);

      // Add the table
      doc.autoTable({
        head: [['Date', 'Sender', 'Receiver', 'Type', 'Reason', 'Received', 'Paid', 'Status']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [33, 150, 243] }
      });

      // Modify the totals section to only show Total Paid
      doc.setFontSize(10);
      doc.text(`Total Paid: ₹${totalPaid}`, 14, doc.lastAutoTable.finalY + 10);

      // Save the PDF
      doc.save(`Daybook_${selectedDate}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF report');
    }
  };

  return (
    <div className="account-management">

      {/* Top Controls Section */}
      <div className="controls-section">
        {/* Calendar on the left */}
        <div className="date-section">
          <label htmlFor="date">Select Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Buttons on the right */}
        <div className="buttons-group">
          <button 
            onClick={generateDaybookPDF}
            className="btn-export"
          >
            Close Daybook
          </button>
          <button 
            className="btn-add" 
            onClick={() => setIsModalOpen(true)}
          >
            Add Entry
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search by Name or Phone"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

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
               <th>Status</th>
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
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => editEntry(entry)}
                      className="btn-action btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="btn-action btn-delete"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => sendMessage(entry)}
                      className="btn-action btn-sms"
                      disabled={entry.status === "Sent"}
                    >
                      Send SMS
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">Total Amount: ₹{totalAmount}</div>
      </div>

      {/* Add Entry Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
          <h2>{editingEntries ? "Edit Entry" : "Add New Entry"}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingEntries) {
                  updateEntry();
                } else {
                  saveEntry();
                }
              }}
            >
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

            <button type="submit">{editingEntries ? "Update" : "Save"}</button>
            <button type="button" onClick={clearForm}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountManagement;
