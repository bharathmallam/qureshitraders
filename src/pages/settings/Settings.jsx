import React, { useState } from "react";
import { db, doc, updateDoc } from "../../apis/Firebase";

function SettingsPopup() {
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [companyPhone, setCompanyPhone] = useState("");
  const [adminNumbers, setAdminNumbers] = useState("");

  const saveSettings = async () => {
    try {
      const settingsDoc = doc(db, "settings", "global");
      await updateDoc(settingsDoc, { companyPhone, adminNumbers });
      setShowSettingsDialog(false); // Close the popup after saving
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  return (
    <div>
      {/* Trigger Button */}
      <button
        onClick={() => setShowSettingsDialog(true)}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
      >
       Settings
      </button>

      {/* Popup Dialog */}
      {showSettingsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h2 className="text-lg font-bold mb-4">Edit Settings</h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Company Phone"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full border p-2 rounded"
              />
              <textarea
                placeholder="Admin Numbers (comma-separated)"
                value={adminNumbers}
                onChange={(e) => setAdminNumbers(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowSettingsDialog(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPopup;
