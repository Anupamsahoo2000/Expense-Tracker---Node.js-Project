const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const toggleForm = document.getElementById("toggleForm");
const formTitle = document.getElementById("formTitle");

// Toggle forms
toggleForm.addEventListener("click", () => {
  if (signupForm.classList.contains("active")) {
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
    formTitle.textContent = "Login";
    toggleForm.textContent = "Don’t have an account? Sign Up";
  } else {
    loginForm.classList.remove("active");
    signupForm.classList.add("active");
    formTitle.textContent = "Sign Up";
    toggleForm.textContent = "Already registered? Login";
  }
});

// Signup Submit
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  try {
    const res = await fetch("http://localhost:5000/user/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      signupForm.reset();
    } else {
      const data = await res.json();
      alert("Error: " + (data.message || "Something went wrong"));
    }
  } catch (err) {
    alert("Failed to connect to server");
  }
});

// Login Submit
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const res = await fetch("http://localhost:5000/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      loginForm.reset();
    } else {
      const data = await res.json();
      alert("Error: " + (data.message || "Something went wrong"));
    }
  } catch (err) {
    alert("Failed to connect to server");
  }
});
