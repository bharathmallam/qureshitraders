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
      Delete
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