import React, { useState, useEffect } from 'react';
import {
  registerTeacher,
  loginTeacher,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getWordBanksByTeacher,
  getWordBanks,
  createWordBank,
  updateWordBank,
  deleteWordBank,
  associateWordBank,
  unassociateWordBank,
  duplicateWordBank,
  getWords,
  createWord,
  updateWord,
  deleteWord,
  createSession
} from '../api';

export default function Dashboard() {
  const [teacher, setTeacher] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', username: '', password: '', registrationCode: '' });
  const [authError, setAuthError] = useState(null);

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentName, setEditStudentName] = useState('');

  const [allWordBanks, setAllWordBanks] = useState([]);
  const [wordBanks, setWordBanks] = useState([]);
  const [selectedWordBank, setSelectedWordBank] = useState(null);
  const [wordBankForm, setWordBankForm] = useState({ name: '' });
  const [editingWordBank, setEditingWordBank] = useState(null);
  const [editWordBankName, setEditWordBankName] = useState('');

  const [words, setWords] = useState([]);
  const [wordForm, setWordForm] = useState({ word: '', translation: '', hint: '', notes: '' });
  const [wordFormError, setWordFormError] = useState(null);
  const [editingWord, setEditingWord] = useState(null);
  const [editWordForm, setEditWordForm] = useState({ word: '', translation: '', hint: '', notes: '' });

  const [sessionLink, setSessionLink] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('teacher');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTeacher(parsed);
      loadStudents(parsed.id);
      loadAllWordBanks(parsed.id);
    }
  }, []);

  const loadStudents = async (teacherId) => {
    const res = await getStudents(teacherId);
    setStudents(res.data);
  };

  const loadAllWordBanks = async (teacherId) => {
    const res = await getWordBanksByTeacher(teacherId);
    setAllWordBanks(res.data);
  };

  const loadWordBanks = async (studentId) => {
    const res = await getWordBanks(studentId);
    setWordBanks(res.data);
  };

  const loadWords = async (wordBankId) => {
    const res = await getWords(wordBankId);
    setWords(res.data);
  };

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const res = await loginTeacher(authForm.username, authForm.password);
      const t = res.data;
      setTeacher(t);
      localStorage.setItem('teacher', JSON.stringify(t));
      loadStudents(t.id);
      loadAllWordBanks(t.id);
    } catch (err) {
      setAuthError(err.response?.data || 'Login failed');
    }
  };

  const handleRegister = async () => {
    setAuthError(null);
    try {
      const res = await registerTeacher(
        authForm.name,
        authForm.username,
        authForm.password,
        authForm.registrationCode
      );
      const t = res.data;
      setTeacher(t);
      localStorage.setItem('teacher', JSON.stringify(t));
      loadStudents(t.id);
      loadAllWordBanks(t.id);
    } catch (err) {
      setAuthError(err.response?.data || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher');
    setTeacher(null);
    setStudents([]);
    setSelectedStudent(null);
    setAllWordBanks([]);
    setWordBanks([]);
    setSelectedWordBank(null);
    setWords([]);
    setSessionLink(null);
    setAuthForm({ name: '', username: '', password: '', registrationCode: '' });
    setAuthError(null);
  };

  // --- Students ---
  const handleCreateStudent = async () => {
    if (!studentForm.name.trim()) return;
    await createStudent(teacher.id, studentForm.name);
    setStudentForm({ name: '' });
    loadStudents(teacher.id);
  };

  const handleUpdateStudent = async (id) => {
    if (!editStudentName.trim()) return;
    await updateStudent(id, editStudentName);
    setEditingStudent(null);
    setEditStudentName('');
    loadStudents(teacher.id);
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Delete this student? This cannot be undone.')) return;
    await deleteStudent(id);
    if (selectedStudent?.id === id) {
      setSelectedStudent(null);
      setWordBanks([]);
      setSelectedWordBank(null);
      setWords([]);
    }
    loadStudents(teacher.id);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSelectedWordBank(null);
    setWords([]);
    setSessionLink(null);
    setEditingWordBank(null);
    loadWordBanks(student.id);
  };

  // --- Word Banks ---
  const handleCreateWordBank = async () => {
    if (!wordBankForm.name.trim()) return;
    await createWordBank(selectedStudent.id, wordBankForm.name);
    setWordBankForm({ name: '' });
    loadWordBanks(selectedStudent.id);
    loadAllWordBanks(teacher.id);
  };

  const handleUpdateWordBank = async (id) => {
    if (!editWordBankName.trim()) return;
    await updateWordBank(id, editWordBankName);
    setEditingWordBank(null);
    setEditWordBankName('');
    loadWordBanks(selectedStudent.id);
    loadAllWordBanks(teacher.id);
  };

  const handleDeleteWordBank = async (id) => {
    if (!window.confirm('Delete this word bank? This cannot be undone.')) return;
    await deleteWordBank(id);
    if (selectedWordBank?.id === id) {
      setSelectedWordBank(null);
      setWords([]);
    }
    loadWordBanks(selectedStudent.id);
    loadAllWordBanks(teacher.id);
  };

  const handleAssociateWordBank = async (wordBankId) => {
    await associateWordBank(wordBankId, selectedStudent.id);
    loadWordBanks(selectedStudent.id);
    loadAllWordBanks(teacher.id);
  };

  const handleUnassociateWordBank = async (wordBankId, studentId) => {
    await unassociateWordBank(wordBankId, studentId);
    if (selectedWordBank?.id === wordBankId) {
      setSelectedWordBank(null);
      setWords([]);
    }
    loadWordBanks(selectedStudent.id);
    loadAllWordBanks(teacher.id);
  };

  const handleDuplicateWordBank = async (wordBankId) => {
    await duplicateWordBank(wordBankId);
    loadWordBanks(selectedStudent.id);
    loadAllWordBanks(teacher.id);
  };

  const handleSelectWordBank = (wordBank) => {
    setSelectedWordBank(wordBank);
    setSessionLink(null);
    setEditingWord(null);
    loadWords(wordBank.id);
  };

  // --- Words ---
  const handleCreateWord = async () => {
    if (!wordForm.word.trim()) {
      setWordFormError('Word cannot be empty');
      return;
    }
    setWordFormError(null);
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

  const handleUpdateWord = async (id) => {
    if (!editWordForm.word.trim()) return;
    await updateWord(id, editWordForm.word, editWordForm.translation, editWordForm.hint, editWordForm.notes);
    setEditingWord(null);
    setEditWordForm({ word: '', translation: '', hint: '', notes: '' });
    loadWords(selectedWordBank.id);
  };

  const handleDeleteWord = async (id) => {
    if (!window.confirm('Delete this word?')) return;
    await deleteWord(id);
    loadWords(selectedWordBank.id);
  };

  const handleCreateSession = async () => {
    const res = await createSession(teacher.id, selectedStudent.id, selectedWordBank.id);
    const token = res.data.inviteToken;
    setSessionLink(`${window.location.origin}/session/${token}`);
  };

  const isAssociated = (wordBankId) => {
    return wordBanks.some(wb => wb.id === wordBankId);
  };

  // Auth screen
  if (!teacher) {
    return (
      <div style={styles.container}>
        <h1>Flashify 🇬🇧</h1>
        <div style={styles.toggleRow}>
          <button
            style={{ ...styles.toggleButton, background: authMode === 'login' ? '#2563eb' : '#e5e7eb', color: authMode === 'login' ? 'white' : '#374151' }}
            onClick={() => { setAuthMode('login'); setAuthError(null); }}
          >Login</button>
          <button
            style={{ ...styles.toggleButton, background: authMode === 'register' ? '#2563eb' : '#e5e7eb', color: authMode === 'register' ? 'white' : '#374151' }}
            onClick={() => { setAuthMode('register'); setAuthError(null); }}
          >Register</button>
        </div>

        {authMode === 'login' && (
          <div style={styles.authForm}>
            <input style={styles.input} placeholder="Username" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} />
            <input style={styles.input} placeholder="Password" type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />
            {authError && <div style={styles.errorText}>{authError}</div>}
            <button style={styles.button} onClick={handleLogin}>Login</button>
          </div>
        )}

        {authMode === 'register' && (
          <div style={styles.authForm}>
            <input style={styles.input} placeholder="Your name" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} />
            <input style={styles.input} placeholder="Username" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} />
            <input style={styles.input} placeholder="Password" type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />
            <input style={styles.input} placeholder="Registration code" type="password" value={authForm.registrationCode} onChange={e => setAuthForm({ ...authForm, registrationCode: e.target.value })} />
            {authError && <div style={styles.errorText}>{authError}</div>}
            <button style={styles.button} onClick={handleRegister}>Register</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={{ margin: 0 }}>Flashify 🇬🇧</h1>
        <div style={styles.headerRight}>
          <span style={styles.welcomeText}>👋 {teacher.name}</span>
          <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Students */}
      <section style={styles.section}>
        <h2>Students</h2>
        <div style={styles.row}>
          <input style={styles.input} placeholder="Student name" value={studentForm.name} onChange={e => setStudentForm({ name: e.target.value })} />
          <button style={styles.button} onClick={handleCreateStudent}>Add Student</button>
        </div>
        <div style={styles.list}>
          {students.map(s => (
            <div key={s.id} style={{ ...styles.listItem, background: selectedStudent?.id === s.id ? '#dbeafe' : '#f9fafb' }}>
              {editingStudent === s.id ? (
                <div style={styles.inlineEditRow}>
                  <input style={styles.input} value={editStudentName} onChange={e => setEditStudentName(e.target.value)} />
                  <button style={styles.saveButton} onClick={() => handleUpdateStudent(s.id)}>Save</button>
                  <button style={styles.cancelButton} onClick={() => setEditingStudent(null)}>Cancel</button>
                </div>
              ) : (
                <div style={styles.itemRow}>
                  <span onClick={() => handleSelectStudent(s)} style={styles.itemLabel}>{s.name}</span>
                  <div style={styles.itemActions}>
                    <button style={styles.editButton} onClick={() => { setEditingStudent(s.id); setEditStudentName(s.name); }}>Edit</button>
                    <button style={styles.deleteButton} onClick={() => handleDeleteStudent(s.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Two column layout for word banks */}
      {selectedStudent && (
        <section style={styles.section}>
          <h2>Word Banks for {selectedStudent.name}</h2>
          <div style={styles.twoCols}>

            {/* Left — student's word banks */}
            <div style={styles.col}>
              <h3 style={styles.colTitle}>Associated Word Banks</h3>
              <div style={styles.row}>
                <input style={styles.input} placeholder="New word bank name" value={wordBankForm.name} onChange={e => setWordBankForm({ name: e.target.value })} />
                <button style={styles.button} onClick={handleCreateWordBank}>Add</button>
              </div>
              <div style={styles.list}>
                {wordBanks.map(wb => (
                  <div key={wb.id} style={{ ...styles.listItem, background: selectedWordBank?.id === wb.id ? '#dbeafe' : '#f9fafb' }}>
                    {editingWordBank === wb.id ? (
                      <div style={styles.inlineEditRow}>
                        <input style={styles.input} value={editWordBankName} onChange={e => setEditWordBankName(e.target.value)} />
                        <button style={styles.saveButton} onClick={() => handleUpdateWordBank(wb.id)}>Save</button>
                        <button style={styles.cancelButton} onClick={() => setEditingWordBank(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div>
                        <div style={styles.itemRow}>
                          <span onClick={() => handleSelectWordBank(wb)} style={styles.itemLabel}><strong>{wb.name}</strong></span>
                          <div style={styles.itemActions}>
                            <button style={styles.duplicateButton} onClick={() => handleDuplicateWordBank(wb.id)} title="Duplicate">⎘</button>
                            <button style={styles.editButton} onClick={() => { setEditingWordBank(wb.id); setEditWordBankName(wb.name); }}>Edit</button>
                            <button style={styles.deleteButton} onClick={() => handleDeleteWordBank(wb.id)}>Delete</button>
                          </div>
                        </div>
                        <div style={styles.associatedStudents}>
                          {wb.students
                            .filter(s => s.id !== selectedStudent.id)
                            .map(s => (
                              <span key={s.id} style={styles.studentTag}>
                                {s.name}
                                <button
                                  style={styles.unassociateButton}
                                  onClick={() => handleUnassociateWordBank(wb.id, s.id)}
                                  title={`Remove ${s.name}`}
                                >−</button>
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — all word banks panel */}
            <div style={styles.col}>
              <h3 style={styles.colTitle}>All Word Banks</h3>
              <div style={styles.scrollPanel}>
                {allWordBanks.map(wb => {
                  const already = isAssociated(wb.id);
                  return (
                    <div key={wb.id} style={styles.panelItem}>
                      <span style={styles.panelItemName}>{wb.name}</span>
                      <button
                        style={{ ...styles.associateButton, opacity: already ? 0.4 : 1, cursor: already ? 'not-allowed' : 'pointer' }}
                        onClick={() => !already && handleAssociateWordBank(wb.id)}
                        disabled={already}
                        title={already ? 'Already associated' : 'Associate with student'}
                      >
                        {already ? '✓ Added' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Words */}
      {selectedWordBank && (
        <section style={styles.section}>
          <h2>Words in {selectedWordBank.name}</h2>
          <div style={styles.row}>
            <input style={styles.input} placeholder="Word *" value={wordForm.word} onChange={e => setWordForm({ ...wordForm, word: e.target.value })} />
            <input style={styles.input} placeholder="Translation" value={wordForm.translation} onChange={e => setWordForm({ ...wordForm, translation: e.target.value })} />
            <input style={styles.input} placeholder="Hint" value={wordForm.hint} onChange={e => setWordForm({ ...wordForm, hint: e.target.value })} />
            <input style={styles.input} placeholder="Notes" value={wordForm.notes} onChange={e => setWordForm({ ...wordForm, notes: e.target.value })} />
            <button style={styles.button} onClick={handleCreateWord}>Add Word</button>
          </div>
          {wordFormError && <div style={styles.errorText}>{wordFormError}</div>}

          <div style={styles.list}>
            {words.map(w => (
              <div key={w.id} style={styles.listItem}>
                {editingWord === w.id ? (
                  <div style={styles.editWordForm}>
                    <input style={styles.input} placeholder="Word *" value={editWordForm.word} onChange={e => setEditWordForm({ ...editWordForm, word: e.target.value })} />
                    <input style={styles.input} placeholder="Translation" value={editWordForm.translation} onChange={e => setEditWordForm({ ...editWordForm, translation: e.target.value })} />
                    <input style={styles.input} placeholder="Hint" value={editWordForm.hint} onChange={e => setEditWordForm({ ...editWordForm, hint: e.target.value })} />
                    <input style={styles.input} placeholder="Notes" value={editWordForm.notes} onChange={e => setEditWordForm({ ...editWordForm, notes: e.target.value })} />
                    <div style={styles.inlineEditRow}>
                      <button style={styles.saveButton} onClick={() => handleUpdateWord(w.id)}>Save</button>
                      <button style={styles.cancelButton} onClick={() => setEditingWord(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.itemRow}>
                    <span style={styles.itemLabel}>
                      <strong>{w.word}</strong>
                      {w.translation && ` — ${w.translation}`}
                      {w.hint && <em> (hint: {w.hint})</em>}
                    </span>
                    <div style={styles.itemActions}>
                      <button style={styles.editButton} onClick={() => { setEditingWord(w.id); setEditWordForm({ word: w.word, translation: w.translation || '', hint: w.hint || '', notes: w.notes || '' }); }}>Edit</button>
                      <button style={styles.deleteButton} onClick={() => handleDeleteWord(w.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

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
  container: { maxWidth: 900, margin: '0 auto', padding: 32, fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  welcomeText: { fontSize: 14, color: '#6b7280' },
  logoutButton: { padding: '6px 14px', borderRadius: 6, background: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 14, color: '#374151' },
  toggleRow: { display: 'flex', gap: 8, marginBottom: 24 },
  toggleButton: { padding: '8px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14 },
  authForm: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 },
  section: { marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 24 },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  input: { padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 },
  button: { padding: '8px 16px', borderRadius: 6, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  listItem: { padding: '10px 14px', borderRadius: 6, fontSize: 14, background: '#f9fafb' },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemLabel: { cursor: 'pointer', flex: 1 },
  itemActions: { display: 'flex', gap: 6 },
  editButton: { padding: '4px 10px', borderRadius: 4, background: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, color: '#374151' },
  deleteButton: { padding: '4px 10px', borderRadius: 4, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', fontSize: 12, color: '#dc2626' },
  saveButton: { padding: '4px 10px', borderRadius: 4, background: '#dcfce7', border: '1px solid #86efac', cursor: 'pointer', fontSize: 12, color: '#16a34a' },
  cancelButton: { padding: '4px 10px', borderRadius: 4, background: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, color: '#374151' },
  duplicateButton: { padding: '4px 10px', borderRadius: 4, background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', fontSize: 12, color: '#2563eb' },
  associateButton: { padding: '4px 10px', borderRadius: 4, background: '#dcfce7', border: '1px solid #86efac', cursor: 'pointer', fontSize: 12, color: '#16a34a' },
  inlineEditRow: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  editWordForm: { display: 'flex', flexDirection: 'column', gap: 8 },
  twoCols: { display: 'flex', gap: 24 },
  col: { flex: 1, minWidth: 0 },
  colTitle: { fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#374151' },
  scrollPanel: { height: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 },
  panelItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 6, background: '#f9fafb', fontSize: 14 },
  panelItemName: { flex: 1, color: '#374151' },
  associatedStudents: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  studentTag: { display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#f3f4f6', borderRadius: 12, fontSize: 12, color: '#6b7280' },
  unassociateButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1, padding: 0 },
  sessionLink: { marginTop: 16, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' },
  errorText: { color: '#dc2626', fontSize: 14, marginBottom: 8 }
};