const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const { headers, ...restOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    ...restOptions,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.error || data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

export function getAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginRequest(username, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  return data.token;
}

export async function registerRequest(username, password) {
  const data = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  return data.token;
}

export async function getCurrentUser(token) {
  const data = await request("/auth/me", {
    headers: getAuthHeaders(token),
  });

  return data.user;
}

export async function fetchNotesRequest(token) {
  const data = await request("/api/notes", {
    headers: getAuthHeaders(token),
  });

  return data.notes || [];
}

export async function createNoteRequest(note, token) {
  const data = await request("/api/notes", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(note),
  });

  return data.note;
}

export async function updateNoteRequest(id, updates, token) {
  const data = await request(`/api/notes/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(updates),
  });

  return data.note;
}

export async function deleteNoteRequest(id, token) {
  await request(`/api/notes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}
