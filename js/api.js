const API = "http://localhost:3000/projects";

export async function getProjects(){

    const response = await axios.get(API);

    return response.data;
}

export async function createProject(project){

    await axios.post(API, project);
}

export async function updateProject(id, data){

    await axios.patch(
        `${API}/${id}`,
        data
    );
}

export async function deleteProject(id){

    await axios.delete(
        `${API}/${id}`
    );
}