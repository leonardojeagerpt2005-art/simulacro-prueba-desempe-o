import { renderLogin }
from "../pages/login.js";

import { renderDashboard }
from "../pages/dashboard.js";

import { renderProjects }
from "../pages/projects.js";

import { getUser }
from "./auth.js";

export function router(){

    const user = getUser();

    const route =
    location.hash || "#login";

    // 1. GUARDIA GLOBAL: Si no está autenticado y va a una ruta privada -> Al Login
    if(
        !user &&
        route !== "#login"
    ){
        location.replace(`${location.pathname}#login`);
        return;
    }

    // 2. GUARDIA INVERSA: Si YA está logueado y va a `#login` -> Al Dashboard
    if(
        user && 
        route === "#login"
    ){
        location.replace(`${location.pathname}#dashboard`);
        return;
    }

    // 3. NUEVO CAMBIO CHARLADO: GUARDIA DE ROL (Protección de vistas administrativas)
    // Si la ruta fuera exclusiva de un administrador o si quieres bloquear vistas completas:
    if (user && user.role === "collaborator" && route === "#admin-panel") {
        alert("Acceso denegado: No tienes permisos de administrador.");
        location.replace(`${location.pathname}#dashboard`);
        return;
    }

    // Sistema de rutas (Switch)
    switch(route){

        case "#login":
            renderLogin();
            break;

        case "#dashboard":
            renderDashboard();
            break;

        case "#projects":
            renderProjects();
            break;
            
        default:
            // Si meten una ruta que no existe, los mandamos al login o dashboard
            location.hash = user ? "#dashboard" : "#login";
            break;
    }
}