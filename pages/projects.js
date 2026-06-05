import { getProjects, createProject, updateProject, deleteProject } from "../js/api.js";
import { getUser } from "../js/auth.js";

// Variable local para saber si estamos editando un proyecto o creando uno nuevo
let editingProjectId = null;

export async function renderProjects() {
    const user = getUser();
    let projects = await getProjects();
    const app = document.getElementById("app");

    // Filtrado inicial por rol: El colaborador solo ve lo suyo, el manager ve todo
    if (user.role !== "manager") {
        projects = projects.filter(p => Number(p.assignedTo) === Number(user.id));
    }

    // --- HTML ESTRUCTURAL BASE ---
    app.innerHTML = `
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h1>Project Repository</h1>
            <a href="#dashboard" class="btn btn-outline" style="text-decoration: none; padding: 8px 16px; border: 1px solid var(--border-color); border-radius: 6px;">
                ← Back to Dashboard
            </a>
        </header>

        <!-- FORMULARIO DE ACCIÓN (Solo visible para el Manager) -->
        ${user.role === "manager" ? `
            <div id="formContainer" style="background: var(--bg-card); padding: 20px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 30px;">
                <h3 id="formTitle" style="margin-bottom: 15px;">Create New Project</h3>
                <form id="projectForm" style="display: flex; flex-direction: column; gap: 12px;">
                    <input type="text" id="projName" placeholder="Project Name" required style="padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <input type="text" id="projDesc" placeholder="Description" required style="padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    
                    <select id="projStatus" style="padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                    
                    <input type="number" id="projAssigned" placeholder="Assigned User ID" required style="padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" id="submitBtn" style="background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            Save Project
                        </button>
                        <button type="button" id="cancelEditBtn" style="display: none; background: #64748b; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        ` : ''}

        <!-- TABLA DE PROYECTOS -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background: var(--border-color); font-size: 0.85rem; text-transform: uppercase;">
                        <th style="padding: 12px;">ID</th>
                        <th style="padding: 12px;">Name</th>
                        <th style="padding: 12px;">Description</th>
                        <th style="padding: 12px;">Status</th>
                        <th style="padding: 12px;">Assignee</th>
                        <th style="padding: 12px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="projectsTableBody">
                    ${projects.map(p => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 12px;">#${p.id}</td>
                            <td style="padding: 12px;"><strong>${p.name}</strong></td>
                            <td style="padding: 12px;">${p.description}</td>
                            <td style="padding: 12px;">
                                <!-- Si es colaborador, puede cambiar el estado directamente desde un select -->
                                ${user.role === "collaborator" ? `
                                    <select class="status-changer" data-id="${p.id}" style="padding: 4px 8px; border-radius: 4px;">
                                        <option value="Pending" ${p.status === "Pending" ? "selected" : ""}>Pending</option>
                                        <option value="In Progress" ${p.status === "In Progress" ? "selected" : ""}>In Progress</option>
                                        <option value="Completed" ${p.status === "Completed" ? "selected" : ""}>Completed</option>
                                    </select>
                                ` : `
                                    <span class="badge" style="padding: 4px 8px; background: #e2e8f0; border-radius: 4px; font-weight: bold;">${p.status}</span>
                                `}
                            </td>
                            <td style="padding: 12px;">User ID: ${p.assignedTo}</td>
                            <td style="padding: 12px;">
                                <!-- Botones de control basados en rol -->
                                ${user.role === "manager" ? `
                                    <button class="edit-btn" data-id="${p.id}" data-name="${p.name}" data-desc="${p.description}" data-status="${p.status}" data-assigned="${p.assignedTo}" style="background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 6px;">
                                        Edit
                                    </button>
                                    <button class="delete-btn" data-id="${p.id}" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                                        Delete
                                    </button>
                                ` : `
                                    <span style="color: #64748b; font-size: 0.85rem; font-style: italic;">Status only</span>
                                `}
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;

    // --- ESCUCHADORES DE EVENTOS (LISTENERS) ---
    setupEventListeners(user);
}

function setupEventListeners(user) {
    const tableBody = document.getElementById("projectsTableBody");

    // 1. MANEJO DEL FORMULARIO (CREAR O EDITAR) - SOLO MANAGER
    if (user.role === "manager") {
        const form = document.getElementById("projectForm");
        const formTitle = document.getElementById("formTitle");
        const cancelBtn = document.getElementById("cancelEditBtn");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const payload = {
                name: document.getElementById("projName").value,
                description: document.getElementById("projDesc").value,
                status: document.getElementById("projStatus").value,
                assignedTo: Number(document.getElementById("projAssigned").value)
            };

            try {
                if (editingProjectId) {
                    // Si hay un ID guardado, hacemos un PATCH (Actualizar)
                    await updateProject(editingProjectId, payload);
                    alert("Project updated successfully!");
                } else {
                    // Si no hay ID, hacemos un POST (Creación limpia)
                    await createProject(payload);
                    alert("Project created successfully!");
                }
                
                // Resetear estado del formulario y recargar vista
                resetForm();
                renderProjects();
            } catch (error) {
                console.error("Error saving project:", error);
                alert("An error occurred while saving.");
            }
        });

        // Botón Cancelar del formulario
        cancelBtn.addEventListener("click", () => {
            resetForm();
        });
    }

    // 2. EVENT DELEGATION PARA CONTROLAR LA TABLA (EDITAR, ELIMINAR, CAMBIO DE ESTADO)
    tableBody.addEventListener("click", async (e) => {
        // A. Acción de Eliminar (Manager)
        if (e.target.classList.contains("delete-btn")) {
            const id = e.target.getAttribute("data-id");
            if (confirm(`Are you sure you want to delete project #${id}?`)) {
                try {
                    await deleteProject(id);
                    alert("Project deleted.");
                    renderProjects(); // Recarga la tabla de inmediato
                } catch (error) {
                    console.error(error);
                }
            }
        }

        // B. Acción de Cargar datos en el Formulario para Editar (Manager)
        if (e.target.classList.contains("edit-btn")) {
            editingProjectId = e.target.getAttribute("data-id");

            // Rellenamos los campos del formulario con los data-attributes del botón
            document.getElementById("projName").value = e.target.getAttribute("data-name");
            document.getElementById("projDesc").value = e.target.getAttribute("data-desc");
            document.getElementById("projStatus").value = e.target.getAttribute("data-status");
            document.getElementById("projAssigned").value = e.target.getAttribute("data-assigned");

            // Ajustamos la interfaz al modo edición
            document.getElementById("formTitle").innerText = `Editing Project #${editingProjectId}`;
            document.getElementById("cancelEditBtn").style.display = "inline-block";
            
            // Subir la pantalla suavemente hacia el formulario
            document.getElementById("formContainer").scrollIntoView({ behavior: 'smooth' });
        }
    });

    // C. Cambio de Estado reactivo (Collaborator)
    tableBody.addEventListener("change", async (e) => {
        if (e.target.classList.contains("status-changer")) {
            const id = e.target.getAttribute("data-id");
            const newStatus = e.target.value;

            try {
                await updateProject(id, { status: newStatus });
                alert(`Status of project #${id} changed to ${newStatus}`);
            } catch (error) {
                console.error(error);
                alert("Could not update status.");
            }
        }
    });
}

// Función auxiliar para limpiar el formulario y devolverlo a su estado original
function resetForm() {
    editingProjectId = null;
    const form = document.getElementById("projectForm");
    if (form) {
        form.reset();
        document.getElementById("formTitle").innerText = "Create New Project";
        document.getElementById("cancelEditBtn").style.display = "none";
    }
}