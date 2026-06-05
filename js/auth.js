const API = "http://localhost:3000";

export async function login(email, password) {

    const response = await axios.get(`${API}/users`);

    const users = response.data;

    const user = users.find(
        u => u.email.trim() === email.trim() &&
            u.password.trim() === password.trim()
    );

    if(user){

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        location.hash = "#dashboard";

    }else{
        alert("Invalid credentials");
    }
}

export function getUser(){
    return JSON.parse(localStorage.getItem("user"));
}

export function logout(){
    localStorage.removeItem("user");
    // CAMBIO CHARLADO: Reemplaza la URL para bloquear el botón "Atrás"
    location.replace(`${location.pathname}#login`);
}