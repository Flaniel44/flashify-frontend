import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.0.165:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const registerTeacher = (name, username, password, registrationCode) =>
  api.post('/teachers/register', { name, username, password, registrationCode });

export const loginTeacher = (username, password) =>
  api.post('/teachers/login', { username, password });

export const getStudents = (teacherId) =>
  api.get(`/students/teacher/${teacherId}`);

export const createStudent = (teacherId, name) =>
  api.post('/students', { teacherId, name });

export const getWordBanks = (studentId) =>
  api.get(`/word-banks/student/${studentId}`);

export const createWordBank = (studentId, name) =>
  api.post('/word-banks', { studentId, name });

export const getWords = (wordBankId) =>
  api.get(`/words/word-bank/${wordBankId}`);

export const createWord = (wordBankId, word, translation, hint, notes) =>
  api.post('/words', { wordBankId, word, translation, hint, notes });

export const createSession = (teacherId, studentId, wordBankId) =>
  api.post('/sessions', { teacherId, studentId, wordBankId });

export const joinSession = (inviteToken) =>
  api.post(`/sessions/join/${inviteToken}`);

export const updateStudent = (id, name) =>
  api.put(`/students/${id}`, { name });

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