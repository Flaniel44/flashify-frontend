import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.0.165:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const createTeacher = (name, email) =>
  api.post('/teachers', { name, email });

export const getStudents = (teacherId) =>
  api.get(`/students/teacher/${teacherId}`);

export const createStudent = (teacherId, name, email) =>
  api.post('/students', { teacherId, name, email });

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