import { db } from "../../apis/Firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import React, { useState, useEffect } from "react";
import "./EmployeeManagement.css";
import Papa from "papaparse";
import AddEntryModal from '../../components/AddEntryModal';
import '../../styles/shared.css';
import '../../styles/buttons.css';

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    employeeId: "",  
    name: "",
    phone: "",
    aadhar: "",
    address: "",
    account: "",
    ifsc: "",
    baseSalary: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const employeeFields = [
    { name: 'employeeId', label: 'Employee ID', required: true },
    { name: 'name', label: 'Name', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: true },
    { name: 'baseSalary', label: 'Base Salary', type: 'number', required: true },
    { name: 'workingDays', label: 'Working Days', type: 'number', required: true }
  ];

  // Fetch employees from Firestore
  const fetchEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "employees"));
      const employeeList = [];
      querySnapshot.forEach((doc) => {
        employeeList.push({ id: doc.id, ...doc.data() });
      });

      // Group employees by Employee ID and aggregate data
      const groupedEmployees = {};

      // Iterate through each employee and aggregate based on employeeId
      employeeList.forEach((employee) => {
        const { employeeId, currentAdvance, amount, workingDays, ...rest } = employee;

        // Initialize if not already present
        if (!groupedEmployees[employeeId]) {
          groupedEmployees[employeeId] = {
            employeeId,
            name: rest.name,
            phone: rest.phone,
            aadhar: rest.aadhar,
            address: rest.address,
            account: rest.account,
            ifsc: rest.ifsc,
            baseSalary: rest.baseSalary,
            totalWorkingDays: 0,
            totalAdvance: 0,
          };
        }

        // Sum the working days and advances for each employeeId
        groupedEmployees[employeeId].totalWorkingDays += parseFloat(workingDays) || 0;
        groupedEmployees[employeeId].totalAdvance += 
          (parseFloat(currentAdvance) || 0) + 
          (parseFloat(amount) || 0);
      });

      // Set the state with the grouped and aggregated employee data
      setEmployees(Object.values(groupedEmployees));
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Error fetching employees.");
    }
  };

  // Save or update employee
  const handleSave = async (formData) => {
    try {
      const employeesRef = collection(db, "employees");

      const q = query(
        employeesRef,
        where("employeeId", "==", formData.employeeId)
      );
      const existingEmployees = await getDocs(q);

      if (existingEmployees.empty && !editingEmployee) {
        // No matching employee, create new record
        await addDoc(employeesRef, { ...formData });
      } else {
        // Update existing employee
        existingEmployees.forEach(async (docSnapshot) => {
          const employeeDoc = doc(db, "employees", docSnapshot.id);
          await updateDoc(employeeDoc, { ...formData });
        });
      }

      fetchEmployees();
      setShowAddModal(false);
      clearForm();
    } catch (err) {
      console.error("Error saving employee:", err);
      setError("Error saving employee.");
    }
  };

  // Clear form
  const clearForm = () => {
    setFormData({
      employeeId: "",
      name: "",
      phone: "",
      aadhar: "",
      address: "",
      account: "",
      ifsc: "",
      baseSalary: "",
    });
    setEditingEmployee(null);
  };

  // Edit employee
  const editEmployee = (employee) => {
    setFormData(employee);
    setEditingEmployee(employee);
    setShowAddModal(true);
  };

  // Delete employee
  const deleteEmployee = async (employeeId) => {
    if (!employeeId) {
        setError("Invalid employee ID");
        return;
    }

    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        // First get all documents with matching employeeId
        const employeesRef = collection(db, "employees");
        const q = query(employeesRef, where("employeeId", "==", employeeId));
        const querySnapshot = await getDocs(q);

        // Delete all matching documents
        const deletePromises = querySnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );
        
        await Promise.all(deletePromises);
        fetchEmployees();
      } catch (err) {
        console.error("Error deleting employee:", err);
        setError("Failed to delete employee. Please try again.");
      }
    }
  };

  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter employees based on the search query
  const filteredEmployees = employees.filter((employee) => {
    return (
      (employee.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (employee.phone?.includes(searchQuery) || "") ||
      (employee.aadhar?.includes(searchQuery) || "") ||
      (employee.address?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (employee.account?.includes(searchQuery) || "") ||
      (employee.ifsc?.includes(searchQuery) || "")
    );
  });

  // Add this function to handle CSV import
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      complete: async (result) => {
        let successCount = 0;
        
        for (const row of result.data) {
          // Skip empty rows
          if (!row || row.length < 4) continue;
          
          const [employeeId, name, phone, baseSalary, workingDays] = row;
          
          // Skip invalid rows
          if (!employeeId || !name || !phone || !baseSalary) continue;
          
          try {
            // Check if employee already exists
            const employeesRef = collection(db, "employees");
            const q = query(employeesRef, where("employeeId", "==", employeeId));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
              // Add new employee
              await addDoc(collection(db, "employees"), {
                employeeId,
                name,
                phone,
                baseSalary: parseFloat(baseSalary),
                workingDays: parseFloat(workingDays || 0),
                address: "", // Default empty values for required fields
                aadhar: "",
                account: "",
                ifsc: "",
                amount: 0,
                currentAdvance: 0
              });
              successCount++;
            }
          } catch (err) {
            console.error(`Error processing employee: ${employeeId}`, err);
          }
        }
        
        if (successCount > 0) {
          setError(`Successfully uploaded ${successCount} employee(s)`);
        } else {
          setError("No new employees were uploaded. They might already exist.");
        }
        
        fetchEmployees(); // Refresh the employee list
      },
      error: (err) => {
        console.error("Error parsing CSV:", err);
        setError("Error parsing CSV file");
      },
      header: false, // Set to true if your CSV has headers
      skipEmptyLines: true
    });
    
    // Reset the file input
    event.target.value = '';
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Set up real-time listener for employee updates
    const employeesRef = collection(db, "employees");
    const unsubscribe = onSnapshot(employeesRef, (snapshot) => {
      fetchEmployees();
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="employee-management">
      {error && <div className="error-message">{error}</div>}

      <div className="controls-section">
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-action btn-add"
        >
          Add Employee
        </button>
        <div className="import-section">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            style={{ display: 'none' }}
            id="csv-upload"
          />
          <button 
            className="btn-import" 
            onClick={() => document.getElementById('csv-upload').click()}
          >
            Import CSV
          </button>
        </div>
      </div>

      {/* Search input */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by Name, Phone, Aadhar, Address, Account, IFSC..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      <div className="employee-table-wrapper">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Aadhar</th>
              <th>Address</th>
              <th>Account</th>
              <th>IFSC</th>
              <th>Base Salary</th>
              <th>Advance</th>
              <th>Experience</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.employeeId}>
                <td>{employee.employeeId}</td>
                <td>{employee.name}</td>
                <td>{employee.phone}</td>
                <td>{employee.aadhar}</td>
                <td>{employee.address}</td>
                <td>{employee.account}</td>
                <td>{employee.ifsc}</td>
                <td>₹{employee.baseSalary}</td>
                <td>₹{employee.totalAdvance}</td> {/* Total Advance */}
                <td>{employee.totalWorkingDays}</td> {/* Total Working Days */}
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => editEmployee(employee)}
                      className="btn-action btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEmployee(employee.employeeId)}
                      className="btn-action btn-delete"
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

      {showAddModal && (
        <AddEntryModal
          title="Add New Employee"
          fields={employeeFields}
          onSave={handleSave}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

export default EmployeeManagement;
