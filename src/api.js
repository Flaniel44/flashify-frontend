import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flashify_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If token is rejected redirect to login
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      localStorage.removeItem('flashify_token');
      localStorage.removeItem('teacher');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const registerTeacher = (name, username, password, registrationCode, email) =>
  api.post('/teachers/register', { name, username, password, registrationCode, email });

export const loginTeacher = (username, password) =>
  api.post('/teachers/login', { username, password });

export const getStudents = (teacherId) =>
  api.get(`/students/teacher/${teacherId}`);

export const getWordBanks = (studentId) =>
  api.get(`/word-banks/student/${studentId}`);

export const createWordBank = (studentId, name) =>
  api.post('/word-banks', { studentId, name });

export const getWords = (wordBankId) =>
  api.get(`/words/word-bank/${wordBankId}`);

export const createWord = (wordBankId, word, translation, hint, notes) =>
  api.post('/words', { wordBankId, word, translation, hint, notes });

export const createSession = (teacherId, studentId, wordBankId, sessionType, shuffled) =>
  api.post('/sessions', { teacherId, studentId, wordBankId, sessionType, shuffled });

export const getSessionWords = (sessionId) =>
  api.get(`/sessions/${sessionId}/words`);

export const joinSession = (inviteToken) =>
  api.post(`/sessions/join/${inviteToken}`);

export const deleteStudent = (id) =>
  api.delete(`/students/${id}`);

export const updateWordBank = (id, name) =>
  api.put(`/word-banks/${id}`, { name });

export const deleteWordBank = (id) =>
  api.delete(`/word-banks/${id}`);

export const updateWord = (id, word, translation, hint, notes) =>
  api.put(`/words/${id}`, { word, translation, hint, notes });

export const deleteWord = (id) =>
  api.delete(`/words/${id}`);

export const getWordBanksByTeacher = (teacherId) =>
  api.get(`/word-banks/teacher/${teacherId}`);

export const associateWordBank = (wordBankId, studentId) =>
  api.post(`/word-banks/${wordBankId}/associate/${studentId}`);

export const unassociateWordBank = (wordBankId, studentId) =>
  api.delete(`/word-banks/${wordBankId}/unassociate/${studentId}`);

export const duplicateWordBank = (wordBankId) =>
  api.post(`/word-banks/${wordBankId}/duplicate`);

export const createStudent = (teacherId, name, email) =>
  api.post('/students', { teacherId, name, email });

export const updateStudent = (id, name, email) =>
  api.put(`/students/${id}`, { name, email });

export const getLastSessionDate = (studentId) =>
  api.get(`/students/${studentId}/last-session`);