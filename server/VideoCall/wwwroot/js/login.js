
const container = document.querySelector(".container");
const registerBtn = document.querySelector(".register-btn");
const loginBtn = document.querySelector(".login-btn");

// XỬ LÝ CHUYỂN ĐỔI GIAO DIỆN (TOGGLE) 
if (registerBtn) {
    registerBtn.addEventListener("click", () => {
        container.classList.add("active");
    });
}

if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        container.classList.remove("active");
    });
}

// --- 2. XỬ LÝ ĐĂNG NHẬP ---
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("loginName").value;
        const passwordInput = document.getElementById("loginPassword").value;

        const loginData = {
            name: nameInput,
            password: passwordInput,
        };

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(loginData),
            });

            if (response.ok) {
                const result = await response.json();

                localStorage.setItem("authToken", result.token);
                localStorage.setItem("userName", result.name);

                alert("Đăng nhập thành công!");

                window.location.href = "/index.html";
            } else {
                const errorText = await response.text();
                alert("Đăng nhập thất bại: " + errorText);
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            alert("Không thể kết nối đến máy chủ (Server chưa chạy hoặc sai URL).");
        }
    });
}
