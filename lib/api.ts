const API_URL = "http://localhost:3001";

export async function getModules(skip = 0, take = 20) {
  const res = await fetch(`${API_URL}/flashcards?skip=${skip}&take=${take}`, { 
    cache: "no-store" 
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch modules");
  }
  
  return res.json();
}

export async function getModule(id: string) {
  const res = await fetch(`${API_URL}/flashcards/${id}`, { 
    cache: "no-store" 
  });
  
  if (!res.ok) {
    return null;
  }
  
  return res.json();
}

export async function updateModule(id: string, data: any) {
  const res = await fetch(`${API_URL}/flashcards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    throw new Error("Failed to update module");
  }
  
  return res.json();
}

