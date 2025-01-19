import React, { useState } from "react";

function TransactionAlert() {
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [phone, setPhone] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    // Validate required fields
    if (!recipientName || !amount || !transactionDate || !phone) {
      alert("Please fill in all fields.");
      return;
    }

    // API URL with template details
    const API_URL = `http://bhashsms.com/api/sendmsg.php?user=QureshiTraders_BW&pass=123456&sender=BUZWAP&phone=${phone}&text=transaction_alert&params=${encodeURIComponent(
      `${recipientName},${amount},${transactionDate}`
    )}&priority=wa&stype=normal`;

    setLoading(true);
    setResponse("");
    setError("");

    try {
      const res = await fetch(API_URL);

      // Check for a successful HTTP status code
      if (!res.ok) {
        throw new Error(`API call failed with status ${res.status}`);
      }

      const data = await res.text(); // Read the response as text

      // Check the API response for success message
      if (data.includes("success") || data.includes("Message Sent")) {
        setResponse(`Message sent successfully: ${data}`);
      } else {
        setError(`Failed to send message. Response: ${data}`);
      }
    } catch (err) {
      console.error("Error occurred:", err.message);
   
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>Transaction Alert</h1>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Recipient Name:
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Enter recipient name"
            style={{
              marginLeft: "10px",
              padding: "5px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Amount Transferred:
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={{
              marginLeft: "10px",
              padding: "5px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Transaction Date:
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            style={{
              marginLeft: "10px",
              padding: "5px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Phone (Without 91):
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            style={{
              marginLeft: "10px",
              padding: "5px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </label>
      </div>
      <button
        onClick={sendMessage}
        disabled={loading}
        style={{
          padding: "10px 20px",
          backgroundColor: loading ? "#cccccc" : "#007BFF",
          color: "#FFF",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Sending..." : "Send Message"}
      </button>

      {response && (
        <div style={{ marginTop: "20px", color: "green" }}>
          <strong>Response:</strong> {response}
        </div>
      )}
      {error && (
        <div style={{ marginTop: "20px", color: "red" }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default TransactionAlert;
