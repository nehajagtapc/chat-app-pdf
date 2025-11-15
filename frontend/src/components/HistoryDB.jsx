import axios from "axios";

// Save message to backend
export const saveMessage = async (userId, from_user, text, docId = null, uploadedName = null) => {
  try {
    await axios.post("http://127.0.0.1:8000/save-message/", {
      user_id: userId,
      from_user,
      text,
      docId,
      uploadedName
    });
  } catch (err) {
    console.error("Error saving message:", err);
  }
};


// Get messages from backend
export const getMessages = async (userId) => {
  try {
    const res = await axios.get(`http://127.0.0.1:8000/get-messages/${userId}`);
    return res.data.chats || [];
  } catch (err) {
    console.error("Error fetching messages:", err);
    return [];
  }
};

