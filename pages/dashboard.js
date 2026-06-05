import { getUser, logout } from "../js/auth.js"; // CAMBIO CHARLADO: Se agregó import de logout
import { getProjects } from "../js/api.js";

export async function renderDashboard(){

    const user = getUser();

    const projects = await getProjects();

    const app = document.getElementById("app");

    if(user.role === "manager"){

        const activos = projects.filter(
            p => p.status === "In Progress"
        ).length;

        const finalizados = projects.filter(
            p => p.status === "Completed"
        ).length;

        // CAMBIO CHARLADO: Se agregó el botón <button id="logoutBtn">Logout</button>
        app.innerHTML = `
        
        <h1>Dashboard Manager</h1>

        <p>Total: ${projects.length}</p>
        <p>Active: ${activos}</p>
        <p>Completed: ${finalizados}</p>

        <a href="#projects">Projects</a>
        <br><br>
        <button id="logoutBtn">Logout</button>
        `;
    }

    else{

        const mine = projects.filter(
            p => Number(p.assignedTo) === Number(user.id)
        );

        // CAMBIO CHARLADO: Se agregó el botón <button id="logoutBtn">Logout</button>
        app.innerHTML = `
        
        <h1>Dashboard Collaborator</h1>

        <p>Assigned Projects: ${mine.length}</p>

        <a href="#projects">Projects</a>
        <br><br>
        <button id="logoutBtn">Logout</button>
        `;
    }

    // CAMBIO CHARLADO: Se escucha el evento click del botón inyectado
    document.getElementById("logoutBtn").addEventListener("click", logout);
}