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
import "./Salaries.css";
import Papa from "papaparse"; // Import PapaParse for CSV parsing
import EditSalaryModal from '../../components/EditSalaryModal';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/buttons.css';

const sendSMS = async (phone, name, amount, date) => {
  const API_URL = `http://bhashsms.com/api/sendmsg.php?user=QureshiTraders_BW&pass=123456&sender=BUZWAP&phone=${phone}&text=transaction_alert&params=${encodeURIComponent(
    `${name},${amount},${date}`
  )}&priority=wa&stype=normal`;

  try {
    const response = await fetch(API_URL, { method: "GET" });
    const result = await response.text();
    console.log("SMS Response:", result);
    return result;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw new Error("Failed to send SMS");
  }
};

function Salaries() {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState(""); // Employee ID state
  const [employeeName, setEmployeeName] = useState("");
  const [phone, setPhone] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [workingDays, setWorkingDays] = useState("");
  const [previousAdvance, setPreviousAdvance] = useState("");
  const [currentAdvance, setCurrentAdvance] = useState("");
  const [paidSalary, setPaidSalary] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csvUploadStatus, setCsvUploadStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // New state for search
  const [selectedMonthYear, setSelectedMonthYear] = useState(""); // State for selected month and year
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calculatedSalaries, setCalculatedSalaries] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    baseSalary: '',
    workingDays: '',
    previousAdvance: '',
    currentAdvance: '',
    paidSalary: ''
  });
  const [selectedFileName, setSelectedFileName] = useState("");

  // Fetch employees from Firestore based on selected month-year
  const fetchEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "employees"));
      const employeeList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include employees for the selected month-year
        if (data.salaryMonthYear === selectedMonthYear) {
          employeeList.push({ 
            id: doc.id, 
            ...data,
            paidSalary: parseFloat(data.paidSalary) || 0
          });
        }
      });
      setEmployees(employeeList);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Error fetching employees.");
    }
  };

  // Handle month-year selection change
  const handleMonthYearChange = (e) => {
    setSelectedMonthYear(e.target.value);
  };

  // Save or update employee
  const saveEmployee = async () => {
    if (!employeeId || !employeeName || !phone || !baseSalary || !workingDays || !previousAdvance || !currentAdvance || !selectedMonthYear) {
      alert("Please fill in all fields and select a month-year.");
      return;
    }

    try {
      if (editingEmployee) {
        // Update existing employee
        const employeeDoc = doc(db, "employees", editingEmployee.id);
        await updateDoc(employeeDoc, {
          employeeId,
          name: employeeName,
          phone,
          baseSalary,
          workingDays,
          previousAdvance,
          currentAdvance,
          paidSalary,
          salaryMonthYear: selectedMonthYear, // Add salaryMonthYear field to track month and year
          status: "Pending",
        });
      } else {
        // Add new employee
        await addDoc(collection(db, "employees"), {
          employeeId,
          name: employeeName,
          phone,
          baseSalary,
          workingDays,
          previousAdvance,
          currentAdvance,
          paidSalary,
          salaryMonthYear: selectedMonthYear, // Add salaryMonthYear field to track month and year
          status: "Pending",
        });
      }
      fetchEmployees();
      setIsModalOpen(false);
      clearForm();
    } catch (err) {
      console.error("Error saving employee:", err);
      setError("Error saving employee.");
    }
  };

  // Clear form fields
  const clearForm = () => {
    setEmployeeId("");
    setEmployeeName("");
    setPhone("");
    setBaseSalary("");
    setWorkingDays("");
    setPreviousAdvance("");
    setCurrentAdvance("");
    setPaidSalary("");
    setEditingEmployee(null);
  };

  // Edit employee details
  const editEmployee = (employee) => {
    setFormData({
      employeeId: employee.employeeId,
      name: employee.name,
      baseSalary: employee.baseSalary,
      workingDays: employee.workingDays,
      previousAdvance: employee.previousAdvance,
      currentAdvance: employee.currentAdvance,
      paidSalary: employee.paidSalary
    });
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  // Delete employee
  const deleteEmployee = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        const employeeDoc = doc(db, "employees", id);
        await deleteDoc(employeeDoc);
        fetchEmployees();
      } catch (err) {
        console.error("Error deleting employee:", err);
        setError("Error deleting employee.");
      }
    }
  };

  // Send SMS notification
  const sendNotification = async (employee) => {
    const { id, phone, name, paidSalary } = employee;
    const today = new Date().toISOString().split("T")[0];

    // Prevent sending SMS if status is already 'Sent'
    if (employee.status === "Sent") {
      alert("SMS already sent for this employee.");
      return;
    }

    try {
      const employeeDoc = doc(db, "employees", id);
      await updateDoc(employeeDoc, { status: "Sent" }); // Set status to 'Sent'
      fetchEmployees();
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Error updating status.");
    }

    setLoading(true);
    try {
      const smsResponse = await sendSMS(phone, name, paidSalary, today);
      console.log("SMS Sent:", smsResponse);
    } catch (err) {
      console.error("Error sending SMS notification:", err);
      setError("Error sending SMS notification.");
    } finally {
      setLoading(false);
    }
  };

  // Modify the handleCSVUpload function
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setCsvUploadStatus("No file selected");
      setSelectedFileName("");
      return;
    }
    
    if (!selectedMonthYear) {
      setCsvUploadStatus("Please select a month and year before uploading CSV");
      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);
    setCsvUploadStatus("Uploading...");
    
    Papa.parse(file, {
      complete: async (result) => {
        try {
          let uploadedCount = 0;
          const rows = result.data.filter(row => row.length >= 5);

          for (const row of rows) {
            console.log("Processing row:", row);

            const [employeeId, name, phone, baseSalary, workingDays, previousAdvance = "0", currentAdvance = "0"] = row;

            // Only check mandatory fields
            if (!employeeId?.trim() || !name?.trim() || !phone?.trim() || !baseSalary || !workingDays) {
              console.log("Skipping invalid row (missing mandatory fields):", row);
              continue;
            }

            try {
              // Add new salary record without calculating paid salary
              await addDoc(collection(db, "employees"), {
                employeeId: employeeId.trim(),
                name: name.trim(),
                phone: phone.trim(),
                baseSalary: parseFloat(baseSalary) || 0,
                workingDays: parseFloat(workingDays) || 0,
                previousAdvance: parseFloat(previousAdvance) || 0,
                currentAdvance: parseFloat(currentAdvance) || 0,
                paidSalary: 0,
                salaryMonthYear: selectedMonthYear,
                status: "Pending",
                timestamp: new Date().toISOString()
              });
              uploadedCount++;
              console.log("Successfully added row:", row);
            } catch (e) {
              console.error("Error adding row:", e);
              console.error("Problematic row:", row);
            }
          }

          if (uploadedCount > 0) {
            await fetchEmployees(); // First fetch the updated employees
            await calculateSalaries(); // Then calculate salaries
            setCsvUploadStatus(`${uploadedCount} employee(s) uploaded and salaries calculated successfully.`);
            await fetchEmployees(); // Fetch again to get the calculated salaries
          } else {
            setCsvUploadStatus("No valid rows found in CSV. Please check the format.");
          }
        } catch (error) {
          console.error("Error processing CSV:", error);
          setCsvUploadStatus("Error processing CSV file");
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setCsvUploadStatus("Error parsing CSV file");
      },
      skipEmptyLines: true,
      header: false
    });

    // Reset the file input
    e.target.value = '';
  };

  // Add new employee
  const addNewEmployee = () => {
    clearForm();
    setIsModalOpen(true);
  };

  // Handle search query change
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter employees based on search query (name or phone)
  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.phone.includes(searchQuery)
  );

  // Fetch employees on component mount and when selected month-year changes
  useEffect(() => {
    if (selectedMonthYear) {
      fetchEmployees();
    } else {
      setEmployees([]); // Clear employees if no month is selected
    }
  }, [selectedMonthYear]);

  // Handle form changes
  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Calculate salaries
  const calculateSalaries = async () => {
    try {
      const calculated = employees.map(emp => {
        const perDaySalary = parseFloat(emp.baseSalary) / 30;
        const earnedSalary = perDaySalary * parseFloat(emp.workingDays);
        const totalAdvance = parseFloat(emp.previousAdvance || 0) + parseFloat(emp.currentAdvance || 0);
        const finalSalary = Math.max(0, earnedSalary - totalAdvance);
        
        return {
          ...emp,
          paidSalary: finalSalary
        };
      });

      // Update all employees in Firestore
      const updatePromises = calculated.map(emp => 
        updateDoc(doc(db, "employees", emp.id), {
          paidSalary: emp.paidSalary
        })
      );

      await Promise.all(updatePromises);
      setEmployees(calculated);
      setError("Salaries calculated successfully!");
    } catch (err) {
      console.error("Error calculating salaries:", err);
      setError("Error calculating salaries.");
    }
  };

  // Update the date handling
  const handleDateChange = (date) => {
    setSelectedDate(date);
    const monthYear = date.toISOString().slice(0, 7); // Format: YYYY-MM
    setSelectedMonthYear(monthYear);
  };

  // Save edited employee
  const saveEditedEmployee = async () => {
    try {
      if (!editingEmployee) {
        setError("No employee selected for editing");
        return;
      }

      const employeeDoc = doc(db, "employees", editingEmployee.id);
      await updateDoc(employeeDoc, {
        ...formData,
        salaryMonthYear: selectedMonthYear,
        baseSalary: parseFloat(formData.baseSalary),
        workingDays: parseFloat(formData.workingDays),
        previousAdvance: parseFloat(formData.previousAdvance),
        currentAdvance: parseFloat(formData.currentAdvance),
        paidSalary: parseFloat(formData.paidSalary)
      });

      setShowEditModal(false);
      setEditingEmployee(null); // Reset editing employee
      fetchEmployees();
    } catch (err) {
      console.error("Error updating employee:", err);
      setError("Error updating employee.");
    }
  };

  return (
    <div className="employee-management">
      <div className="controls-section">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          className="date-picker"
        />

        <div className="file-upload-section">
          <div className="file-input-wrapper">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="csv-upload"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="file-label">
              {selectedFileName || "Choose File"}
            </label>
          </div>
        </div>
      </div>

      {/* Show selected file name */}
      {selectedFileName && (
        <div className="selected-file">
          Selected file: {selectedFileName}
        </div>
      )}

      {/* Show CSV upload status with proper styling */}
      {csvUploadStatus && (
        <div className={csvUploadStatus.includes("successfully") ? "success-message" : "error-message"}>
          {csvUploadStatus}
        </div>
      )}

      <div className="employee-table">
      <div className="employee-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Base Salary</th>
              <th>Working Days</th>
              <th>Previous Advance</th>
              <th>Current Advance</th>
              <th>Paid Salary</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.employeeId}</td>
                <td>{employee.name}</td>
                <td>{employee.phone}</td>
                <td>{employee.baseSalary}</td>
                <td>{employee.workingDays}</td>
                <td>{employee.previousAdvance}</td>
                <td>{employee.currentAdvance}</td>
                <td>{employee.paidSalary}</td>
                <td>{employee.status}</td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => editEmployee(employee)}
                      className="btn-action btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEmployee(employee.id)}
                      className="btn-action btn-delete"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => sendNotification(employee)}
                      className="btn-action btn-sms"
                      disabled={loading || employee.status === "Sent"}
                    >
                      {loading ? "Sending..." : "Send SMS"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {showEditModal && (
        <EditSalaryModal
          employee={editingEmployee}
          formData={formData}
          onChange={handleFormChange}
          onSave={saveEditedEmployee}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

export default Salaries;
