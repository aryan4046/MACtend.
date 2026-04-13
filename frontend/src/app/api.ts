// âœ… Dynamic backend access
const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

export async function detectMac() {
  const response = await fetch(`${API_BASE_URL}/detect-mac`);
  return await response.json();
}

export async function registerStudent(data: any) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await response.json();
}

export async function getAttendance() {
  const response = await fetch(`${API_BASE_URL}/attendance`);
  return await response.json();
}

export async function loginTeacher(data: any) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await response.json();
}

export async function startSession(data: {
  programme: string,
  branch: string,
  semester: string,
  sections: string[],
  subject: string
}) {
  const response = await fetch(`${API_BASE_URL}/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await response.json();
}

export async function stopSession() {
  const response = await fetch(`${API_BASE_URL}/session/stop`, {
    method: "POST",
  });
  return await response.json();
}

export async function getSessionStatus() {
  const response = await fetch(`${API_BASE_URL}/session/status`);
  return await response.json();
}

export async function getSessionStats() {
  const response = await fetch(`${API_BASE_URL}/session/stats`);
  return await response.json();
}

export async function getCurrentTimetable() {
  const response = await fetch(`${API_BASE_URL}/timetable/current`);
  return await response.json();
}

export async function getSections(
  programme: string,
  branch: string,
  semester: string
) {
  const response = await fetch(
    `${API_BASE_URL}/sections?programme=${programme}&branch=${branch}&semester=${semester}`
  );
  return await response.json();
}

export async function toggleAttendance(data: {
  studentId: string,
  subject: string,
  present: boolean,
  source?: string
}) {
  const response = await fetch(`${API_BASE_URL}/attendance/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await response.json();
}

// CSV Export
export const EXPORT_URL = `http://${window.location.hostname}:5000/api/export/csv`;