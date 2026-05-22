import React, { useState, useEffect } from 'react';
import {
  createTeacher,
  getStudents,
  createStudent,
  getWordBanks,
  createWordBank,
  getWords,
  createWord,
  createSession
} from '../api';

export default function Dashboard() {
  const [teacher, setTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '' });

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', email: '' });

  const [wordBanks, setWordBanks] = useState([]);
  const [selectedWordBank, setSelectedWordBank] = useState(null);
  const [wordBankForm, setWordBankForm] = useState({ name: '' });

  const [words, setWords] = useState([]);
  const [wordForm, setWordForm] = useState({ word: '', translation: '', hint: '', notes: '' });

  const [sessionLink, setSessionLink] = useState(null);

  // Load teacher from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem('teacher');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTeacher(parsed);
      loadStudents(parsed.id);
    }
  }, []);

  const loadStudents = async (teacherId) => {
    const res = await getStudents(teacherId);
    setStudents(res.data);
  };

  const loadWordBanks = async (studentId) => {
    const res = await getWordBanks(studentId);
    setWordBanks(res.data);
  };

  const loadWords = async (wordBankId) => {
    const res = await getWords(wordBankId);
    setWords(res.data);
  };

  const handleCreateTeacher = async () => {
    const res = await createTeacher(teacherForm.name, teacherForm.email);
    const t = res.data;
    setTeacher(t);
    localStorage.setItem('teacher', JSON.stringify(t));
    loadStudents(t.id);
  };

  const handleCreateStudent = async () => {
    await createStudent(teacher.id, studentForm.name, studentForm.email);
    setStudentForm({ name: '', email: '' });
    loadStudents(teacher.id);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSelectedWordBank(null);
    setWords([]);
    setSessionLink(null);
    loadWordBanks(student.id);
  };

  const handleCreateWordBank = async () => {
    await createWordBank(selectedStudent.id, wordBankForm.name);
    setWordBankForm({ name: '' });
    loadWordBanks(selectedStudent.id);
  };

  const handleSelectWordBank = (wordBank) => {
    setSelectedWordBank(wordBank);
    setSessionLink(null);
    loadWords(wordBank.id);
  };

  const handleCreateWord = async () => {
    await createWord(
      selectedWordBank.id,
      wordForm.word,
      wordForm.translation,
      wordForm.hint,
      wordForm.notes
    );
    setWordForm({ word: '', translation: '', hint: '', notes: '' });
    loadWords(selectedWordBank.id);
  };

  const handleCreateSession = async () => {
    const res = await createSession(teacher.id, selectedStudent.id, selectedWordBank.id);
    const token = res.data.inviteToken;
    setSessionLink(`${window.location.origin}/session/${token}`);
  };

  if (!teacher) {
    return (
      <div style={styles.container}>
        <h1>Welcome to Flashify 👋</h1>
        <h2>Create your teacher account</h2>
        <input
          style={styles.input}
          placeholder="Your name"
          value={teacherForm.name}
          onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Your email"
          value={teacherForm.email}
          onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
        />
        <button style={styles.button} onClick={handleCreateTeacher}>Get Started</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Flashify Dashboard 👩‍🏫</h1>
      <p>Welcome back, {teacher.name}!</p>

      {/* Students */}
      <section style={styles.section}>
        <h2>Students</h2>
        <div style={styles.row}>
          <input
            style={styles.input}
            placeholder="Student name"
            value={studentForm.name}
            onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Student email"
            value={studentForm.email}
            onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
          />
          <button style={styles.button} onClick={handleCreateStudent}>Add Student</button>
        </div>
        <div style={styles.list}>
          {students.map(s => (
            <div
              key={s.id}
              style={{
                ...styles.listItem,
                background: selectedStudent?.id === s.id ? '#dbeafe' : '#f9fafb'
              }}
              onClick={() => handleSelectStudent(s)}
            >
              {s.name}
            </div>
          ))}
        </div>
      </section>

      {/* Word Banks */}
      {selectedStudent && (
        <section style={styles.section}>
          <h2>Word Banks for {selectedStudent.name}</h2>
          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Word bank name"
              value={wordBankForm.name}
              onChange={e => setWordBankForm({ name: e.target.value })}
            />
            <button style={styles.button} onClick={handleCreateWordBank}>Add Word Bank</button>
          </div>
          <div style={styles.list}>
            {wordBanks.map(wb => (
              <div
                key={wb.id}
                style={{
                  ...styles.listItem,
                  background: selectedWordBank?.id === wb.id ? '#dbeafe' : '#f9fafb'
                }}
                onClick={() => handleSelectWordBank(wb)}
              >
                {wb.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Words */}
      {selectedWordBank && (
        <section style={styles.section}>
          <h2>Words in {selectedWordBank.name}</h2>
          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Word"
              value={wordForm.word}
              onChange={e => setWordForm({ ...wordForm, word: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="Translation"
              value={wordForm.translation}
              onChange={e => setWordForm({ ...wordForm, translation: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="Hint"
              value={wordForm.hint}
              onChange={e => setWordForm({ ...wordForm, hint: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="Notes"
              value={wordForm.notes}
              onChange={e => setWordForm({ ...wordForm, notes: e.target.value })}
            />
            <button style={styles.button} onClick={handleCreateWord}>Add Word</button>
          </div>
          <div style={styles.list}>
            {words.map(w => (
              <div key={w.id} style={styles.listItem}>
                <strong>{w.word}</strong>
                {w.translation && ` — ${w.translation}`}
                {w.hint && <em> (hint: {w.hint})</em>}
              </div>
            ))}
          </div>

          {/* Start Session */}
          <button style={{ ...styles.button, marginTop: 24, background: '#16a34a' }} onClick={handleCreateSession}>
            Start Session with {selectedStudent.name}
          </button>

          {sessionLink && (
            <div style={styles.sessionLink}>
              <p>Share this link with {selectedStudent.name}:</p>
              <a href={sessionLink} target="_blank" rel="noreferrer">{sessionLink}</a>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: 800, margin: '0 auto', padding: 32, fontFamily: 'sans-serif' },
  section: { marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 24 },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  input: { padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 },
  button: { padding: '8px 16px', borderRadius: 6, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  listItem: { padding: '10px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  sessionLink: { marginTop: 16, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }
};