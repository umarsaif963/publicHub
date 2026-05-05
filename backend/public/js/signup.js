const BASE_URL = "http://localhost:3001/user";

document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    try {
        const res = await fetch(`${BASE_URL}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password, confirmPassword })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        alert("Signup successful");
        window.location.href = "login.html";

    } catch (err) {
        alert(err.message);
    }
});