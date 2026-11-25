const API_URL = 'http://localhost:3000';
let authorization = '';

export function setCredentials(username, password) {
    // TextEncoder supports credentials containing non-ASCII characters as well.
    authorization = 'Basic ' + btoa(String.fromCharCode(...new TextEncoder().encode(`${username}:${password}`)));
}
export function clearCredentials() { authorization = ''; }
export async function request(path, method = 'GET', data) {
    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: { Authorization: authorization, ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join('; ') : result.message || `HTTP ${response.status}`);
    return result;
}
