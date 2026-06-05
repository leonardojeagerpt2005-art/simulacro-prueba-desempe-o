import { login } from "../js/auth.js";

export function renderLogin(){

    const app = document.getElementById("app");

    app.innerHTML = `
    
    <h1>Login</h1>

    <form id="loginForm">

        <input
            type="email"
            id="email"
            placeholder="Email"
        >

        <input
            type="password"
            id="password"
            placeholder="Password"
        >

        <button type="submit">
            Login
        </button>

    </form>
    `;

    document
    .getElementById("loginForm")
    .addEventListener("submit",(e)=>{

        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        console.log(email);
        console.log(password);

        login(email, password);

    });
}