const base_url = "http://localhost:5000";


document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("forgotEmail").value.trim();

  if (!email) return alert("Please enter your email");

  try {
    const res = await axios.post(
      `${base_url}/password/forgotpassword`,
      { email }
    );
    alert(res.data.message || "Reset link sent to your email!");
    document.getElementById("forgotForm").reset();
  } catch (err) {
    console.error("Forgot Password Error:", err);
    alert(
      err.response?.data?.message ||
        "Failed to send reset link. Please try again."
    );
  }
});
