const form = document.getElementById("signupForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear old errors
  document.getElementById("nameError").innerText = "";
  document.getElementById("emailError").innerText = "";
  document.getElementById("passwordError").innerText = "";

  // Get values
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  let hasError = false;

  if (!name) {
    document.getElementById("nameError").innerText = "Name is required";
    hasError = true;
  }
  if (!email) {
    document.getElementById("emailError").innerText = "Email is required";
    hasError = true;
  }
  if (!password) {
    document.getElementById("passwordError").innerText = "Password is required";
    hasError = true;
  }

  if (hasError) return;

  // Send data to backend
  try {
    const response = await fetch("http://localhost:5000/user/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (response.ok) {
      alert("Signup successful!");
      form.reset();
    } else {
      const data = await response.json();
      alert("Error: " + (data.message || "Something went wrong"));
    }
  } catch (err) {
    alert("Failed to connect to server");
  }
});
