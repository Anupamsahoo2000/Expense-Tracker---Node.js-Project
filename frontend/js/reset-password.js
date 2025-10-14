const resetForm = document.getElementById("resetForm");
const msg = document.getElementById("msg");

// Extract request ID from query params
const params = new URLSearchParams(window.location.search);
const requestId = params.get("id");

// Verify link validity on load
async function verifyLink() {
  try {
    const res = await axios.get(
      `http://localhost:5000/password/resetpassword/${requestId}`
    );
    console.log(res.data.message);
  } catch (err) {
    msg.textContent = err.response?.data?.message || "Invalid or expired link";
    resetForm.style.display = "none";
  }
}

verifyLink();

// Handle password reset form submission
resetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("newPassword").value.trim();
  if (!password) return (msg.textContent = "Please enter a new password");

  try {
    const res = await axios.post(
      `http://localhost:5000/password/resetpassword/${requestId}`,
      { password }
    );
    msg.style.color = "green";
    msg.textContent = res.data.message;

    // Optional: redirect after success
    setTimeout(() => {
      window.location.href = "./index.html"; // back to login
    }, 2000);
  } catch (err) {
    msg.textContent = err.response?.data?.message || "Failed to reset password";
  }
});
