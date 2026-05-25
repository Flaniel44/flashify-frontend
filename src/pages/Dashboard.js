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
  createSession,
  getLastSessionDate
} from '../api';

import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Dashboard() {
  const [teacher, setTeacher] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', username: '', password: '', registrationCode: '', email: '' });
  const [authError, setAuthError] = useState(null);

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', email: '' });
  const [editStudentEmail, setEditStudentEmail] = useState('');
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
  const [sessionType, setSessionType] = useState('alternating');
  const [shuffled, setShuffled] = useState(false);
  const [lastSessionDates, setLastSessionDates] = useState({});
  const [wordBankSearch, setWordBankSearch] = useState('');
  const [wordBankFilterStudent, setWordBankFilterStudent] = useState('');

  const { theme } = useTheme();
  const navigate = useNavigate();

  const isMobile = useIsMobile();
  const [wordBankPanelOpen, setWordBankPanelOpen] = useState(false);

  const [studentSearch, setStudentSearch] = useState('');

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
    loadLastSessionDates(res.data);
  };

  const loadLastSessionDates = async (studentList) => {
    const dates = {};
    await Promise.all(studentList.map(async (s) => {
      const res = await getLastSessionDate(s.id);
      dates[s.id] = res.data;
    }));
    setLastSessionDates(dates);
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
    const { teacher: t, token } = res.data;
    setTeacher(t);
    localStorage.setItem('teacher', JSON.stringify(t));
    localStorage.setItem('flashify_token', token);
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
      authForm.registrationCode,
      authForm.email
    );
    const { teacher: t, token } = res.data;
    setTeacher(t);
    localStorage.setItem('teacher', JSON.stringify(t));
    localStorage.setItem('flashify_token', token);
    loadStudents(t.id);
    loadAllWordBanks(t.id);
  } catch (err) {
    setAuthError(err.response?.data || 'Registration failed');
  }
};

 const handleLogout = () => {
  localStorage.removeItem('teacher');
  localStorage.removeItem('flashify_token');
  setTeacher(null);
  setStudents([]);
  setSelectedStudent(null);
  setAllWordBanks([]);
  setWordBanks([]);
  setSelectedWordBank(null);
  setWords([]);
  setSessionLink(null);
  setAuthForm({ name: '', username: '', password: '', registrationCode: '', email: '' });
  setAuthError(null);
};

  const handleCreateStudent = async () => {
    if (!studentForm.name.trim()) return;
    await createStudent(teacher.id, studentForm.name, studentForm.email);
    setStudentForm({ name: '', email: '' });
    loadStudents(teacher.id);
  };

  const handleUpdateStudent = async (id) => {
    if (!editStudentName.trim()) return;
    await updateStudent(id, editStudentName, editStudentEmail);
    setEditingStudent(null);
    setEditStudentName('');
    setEditStudentEmail('');
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

  const handleCreateWord = async () => {
    if (!wordForm.word.trim()) {
      setWordFormError('Word cannot be empty');
      return;
    }
    setWordFormError(null);
    await createWord(selectedWordBank.id, wordForm.word, wordForm.translation, wordForm.hint, wordForm.notes);
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
    const res = await createSession(teacher.id, selectedStudent.id, selectedWordBank.id, sessionType, shuffled);
    const token = res.data.inviteToken;
    setSessionLink(`${window.location.origin}/session/${token}`);
  };

  const isAssociated = (wordBankId) => wordBanks.some(wb => wb.id === wordBankId);

  const inputStyle = {
    ...styles.input,
    background: theme.surface,
    color: theme.text,
    border: `1px solid ${theme.border}`
  };

  const listItemStyle = (selected) => ({
    ...styles.listItem,
    background: selected ? theme.selectedBg : theme.surface,
    color: theme.text
  });

  if (!teacher) {
    return (
      <div style={{ ...styles.container, background: theme.background, color: theme.text }}>
        <h1 style={{ color: theme.text }}>Flashify 🇬🇧</h1>
        <div style={styles.toggleRow}>
          <button
            style={{ ...styles.toggleButton, background: authMode === 'login' ? theme.primary : theme.surfaceAlt, color: authMode === 'login' ? theme.primaryText : theme.text }}
            onClick={() => { setAuthMode('login'); setAuthError(null); }}
          >Login</button>
          <button
            style={{ ...styles.toggleButton, background: authMode === 'register' ? theme.primary : theme.surfaceAlt, color: authMode === 'register' ? theme.primaryText : theme.text }}
            onClick={() => { setAuthMode('register'); setAuthError(null); }}
          >Register</button>
        </div>

        {authMode === 'login' && (
          <div style={styles.authForm}>
            <input style={inputStyle} placeholder="Username" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} />
            <input style={inputStyle} placeholder="Password" type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />
            {authError && <div style={styles.errorText}>{authError}</div>}
            <button style={{ ...styles.button, background: theme.primary, color: theme.primaryText }} onClick={handleLogin}>Login</button>
          </div>
        )}

        {authMode === 'register' && (
          <div style={styles.authForm}>
            <input style={inputStyle} placeholder="Your name" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} />
            <input style={inputStyle} placeholder="Username" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} />
            <input style={inputStyle} placeholder="Email (optional)" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} />
            <input style={inputStyle} placeholder="Password" type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />
            <input style={inputStyle} placeholder="Registration code" type="password" value={authForm.registrationCode} onChange={e => setAuthForm({ ...authForm, registrationCode: e.target.value })} />
            {authError && <div style={styles.errorText}>{authError}</div>}
            <button style={{ ...styles.button, background: theme.primary, color: theme.primaryText }} onClick={handleRegister}>Register</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, background: theme.background, color: theme.text }}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={{ margin: 0, color: theme.text }}>Flashify 🇬🇧</h1>
        <div style={styles.headerRight}>
          <span
            style={{ ...styles.welcomeText, color: theme.textMuted, cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/settings')}
            title="Settings"
          >
            👋 {teacher.name}
          </span>
          <button style={{ ...styles.logoutButton, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Students */}
      <section style={{ ...styles.section, borderTop: `1px solid ${theme.border}` }}>
        <h2 style={{ color: theme.text }}>Students</h2>
        <div style={{ maxWidth: isMobile ? '100%' : '50%' }}>
        <div style={styles.row}>
          <input style={inputStyle} placeholder="Student name" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} />
          <input style={inputStyle} placeholder="Student email" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} />
          <button style={{ ...styles.button, background: theme.primary, color: theme.primaryText }} onClick={handleCreateStudent}>Add Student</button>
        </div>
        <input
  style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
  placeholder="Search students..."
  value={studentSearch}
  onChange={e => setStudentSearch(e.target.value)}
/>
        <div style={{ ...styles.list, maxHeight: students.length > 5 ? 400 : 'none', overflowY: students.length > 5 ? 'auto' : 'visible' }}>
  {students
    .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentSearch.toLowerCase()))
    .map(s => (
            <div key={s.id} style={listItemStyle(selectedStudent?.id === s.id)}>
              {editingStudent === s.id ? (
                <div style={styles.inlineEditRow}>
                  <input style={inputStyle} placeholder="Name" value={editStudentName} onChange={e => setEditStudentName(e.target.value)} />
                  <input style={inputStyle} placeholder="Email" value={editStudentEmail} onChange={e => setEditStudentEmail(e.target.value)} />
                  <button style={styles.saveButton} onClick={() => handleUpdateStudent(s.id)}>Save</button>
                  <button style={styles.cancelButton} onClick={() => setEditingStudent(null)}>Cancel</button>
                </div>
              ) : (
                <div style={styles.itemRow}>
                  <div style={styles.studentInfo} onClick={() => handleSelectStudent(s)}>
                    <span style={{ ...styles.itemLabel, color: theme.text }}>{s.name}</span>
                    {s.email && <span style={{ ...styles.studentEmail, color: theme.textMuted }}>{s.email}</span>}
                    {lastSessionDates[s.id] && (
                      <span style={{ ...styles.lastSession, color: theme.textLight }}>
                        Last session: {new Date(lastSessionDates[s.id]).toLocaleString()}
                      </span>
                    )}
                    {!lastSessionDates[s.id] && (
                      <span style={{ ...styles.lastSession, color: theme.textLight }}>No sessions yet</span>
                    )}
                  </div>
                  <div style={styles.itemActions}>
                    <button style={{ ...styles.editButton, background: theme.surfaceAlt, border: `1px solid ${theme.border}`, color: theme.text }} onClick={() => { setEditingStudent(s.id); setEditStudentName(s.name); setEditStudentEmail(s.email || ''); }}>Edit</button>
                    <button style={styles.deleteButton} onClick={() => handleDeleteStudent(s.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* Two column layout for word banks */}
      {selectedStudent && (
        <section style={{ ...styles.section, borderTop: `1px solid ${theme.border}` }}>
          <h2 style={{ color: theme.text }}>Word Banks for {selectedStudent.name}</h2>
          <div style={isMobile ? styles.oneCol : styles.twoCols}>

  {/* On mobile: All Word Banks comes first and is collapsible */}
  {isMobile && (
    <div style={styles.col}>
      <button
        style={{ ...styles.collapsibleHeader, background: theme.surfaceAlt, color: theme.text, border: `1px solid ${theme.border}` }}
        onClick={() => setWordBankPanelOpen(!wordBankPanelOpen)}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>All Word Banks</span>
        <span>{wordBankPanelOpen ? '▲' : '▼'}</span>
      </button>

      {wordBankPanelOpen && (
        <div style={{ marginTop: 8 }}>
          <input
            style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
            placeholder="Search word banks..."
            value={wordBankSearch}
            onChange={e => setWordBankSearch(e.target.value)}
          />
          <select
            style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
            value={wordBankFilterStudent}
            onChange={e => setWordBankFilterStudent(e.target.value)}
          >
            <option value="">All students</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div style={{ ...styles.scrollPanel, border: `1px solid ${theme.border}`, background: theme.background }}>
            {allWordBanks
              .filter(wb => {
                const matchesSearch = wb.name.toLowerCase().includes(wordBankSearch.toLowerCase());
                const matchesStudent = wordBankFilterStudent === '' || wb.students.some(s => s.id === wordBankFilterStudent);
                return matchesSearch && matchesStudent;
              })
              .map(wb => {
                const already = isAssociated(wb.id);
                return (
                  <div key={wb.id} style={{ ...styles.panelItem, background: theme.surface }}>
                    <div style={styles.panelItemInfo}>
                      <span style={{ ...styles.panelItemName, color: theme.text }}>{wb.name}</span>
                      <span style={{ ...styles.panelItemStudents, color: theme.textLight }}>
                        {wb.students.map(s => s.name).join(', ')}
                      </span>
                    </div>
                    <button
                      style={{ ...styles.associateButton, opacity: already ? 0.4 : 1, cursor: already ? 'not-allowed' : 'pointer' }}
                      onClick={() => !already && handleAssociateWordBank(wb.id)}
                      disabled={already}
                    >
                      {already ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            {allWordBanks.filter(wb => {
              const matchesSearch = wb.name.toLowerCase().includes(wordBankSearch.toLowerCase());
              const matchesStudent = wordBankFilterStudent === '' || wb.students.some(s => s.id === wordBankFilterStudent);
              return matchesSearch && matchesStudent;
            }).length === 0 && (
              <div style={{ ...styles.noResults, color: theme.textLight }}>No word banks found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )}

  {/* Left — student's associated word banks (always visible) */}
  <div style={styles.col}>
    <h3 style={{ ...styles.colTitle, color: theme.text }}>Associated Word Banks</h3>
    <div style={styles.row}>
      <input style={inputStyle} placeholder="New word bank name" value={wordBankForm.name} onChange={e => setWordBankForm({ name: e.target.value })} />
      <button style={{ ...styles.button, background: theme.primary, color: theme.primaryText }} onClick={handleCreateWordBank}>Add</button>
    </div>
    <div style={styles.list}>
      {wordBanks.map(wb => (
        <div key={wb.id} style={listItemStyle(selectedWordBank?.id === wb.id)}>
          {editingWordBank === wb.id ? (
            <div style={styles.inlineEditRow}>
              <input style={inputStyle} value={editWordBankName} onChange={e => setEditWordBankName(e.target.value)} />
              <button style={styles.saveButton} onClick={() => handleUpdateWordBank(wb.id)}>Save</button>
              <button style={styles.cancelButton} onClick={() => setEditingWordBank(null)}>Cancel</button>
            </div>
          ) : (
            <div>
              <div style={styles.itemRow}>
                <span onClick={() => handleSelectWordBank(wb)} style={{ ...styles.itemLabel, color: theme.text }}><strong>{wb.name}</strong></span>
                <div style={styles.itemActions}>
                  <button style={{ ...styles.duplicateButton, background: theme.surfaceAlt, border: `1px solid ${theme.border}`, color: theme.primary }} onClick={() => handleDuplicateWordBank(wb.id)} title="Duplicate">⎘</button>
                  <button style={{ ...styles.editButton, background: theme.surfaceAlt, border: `1px solid ${theme.border}`, color: theme.text }} onClick={() => { setEditingWordBank(wb.id); setEditWordBankName(wb.name); }}>Edit</button>
                  <button style={styles.deleteButton} onClick={() => handleDeleteWordBank(wb.id)}>Delete</button>
                </div>
              </div>
              <div style={styles.associatedStudents}>
                {wb.students
                  .filter(s => s.id !== selectedStudent.id)
                  .map(s => (
                    <span key={s.id} style={{ ...styles.studentTag, background: theme.surfaceAlt, color: theme.textMuted }}>
                      {s.name}
                      <button style={styles.unassociateButton} onClick={() => handleUnassociateWordBank(wb.id, s.id)} title={`Remove ${s.name}`}>−</button>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>

  {/* Right — all word banks panel (desktop only) */}
  {!isMobile && (
    <div style={styles.col}>
      <h3 style={{ ...styles.colTitle, color: theme.text }}>All Word Banks</h3>
      <input
        style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
        placeholder="Search word banks..."
        value={wordBankSearch}
        onChange={e => setWordBankSearch(e.target.value)}
      />
      <select
        style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
        value={wordBankFilterStudent}
        onChange={e => setWordBankFilterStudent(e.target.value)}
      >
        <option value="">All students</option>
        {students.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <div style={{ ...styles.scrollPanel, border: `1px solid ${theme.border}`, background: theme.background }}>
        {allWordBanks
          .filter(wb => {
            const matchesSearch = wb.name.toLowerCase().includes(wordBankSearch.toLowerCase());
            const matchesStudent = wordBankFilterStudent === '' || wb.students.some(s => s.id === wordBankFilterStudent);
            return matchesSearch && matchesStudent;
          })
          .map(wb => {
            const already = isAssociated(wb.id);
            return (
              <div key={wb.id} style={{ ...styles.panelItem, background: theme.surface }}>
                <div style={styles.panelItemInfo}>
                  <span style={{ ...styles.panelItemName, color: theme.text }}>{wb.name}</span>
                  <span style={{ ...styles.panelItemStudents, color: theme.textLight }}>
                    {wb.students.map(s => s.name).join(', ')}
                  </span>
                </div>
                <button
                  style={{ ...styles.associateButton, opacity: already ? 0.4 : 1, cursor: already ? 'not-allowed' : 'pointer' }}
                  onClick={() => !already && handleAssociateWordBank(wb.id)}
                  disabled={already}
                >
                  {already ? '✓ Added' : '+ Add'}
                </button>
              </div>
            );
          })}
        {allWordBanks.filter(wb => {
          const matchesSearch = wb.name.toLowerCase().includes(wordBankSearch.toLowerCase());
          const matchesStudent = wordBankFilterStudent === '' || wb.students.some(s => s.id === wordBankFilterStudent);
          return matchesSearch && matchesStudent;
        }).length === 0 && (
          <div style={{ ...styles.noResults, color: theme.textLight }}>No word banks found</div>
        )}
      </div>
    </div>
  )}

</div>
        </section>
      )}

      {/* Words */}
      {selectedWordBank && (
        <section style={{ ...styles.section, borderTop: `1px solid ${theme.border}` }}>
          <h2 style={{ color: theme.text }}>Words in {selectedWordBank.name}</h2>
          <div style={styles.row}>
            <input style={inputStyle} placeholder="Word *" value={wordForm.word} onChange={e => setWordForm({ ...wordForm, word: e.target.value })} />
            <input style={inputStyle} placeholder="Translation" value={wordForm.translation} onChange={e => setWordForm({ ...wordForm, translation: e.target.value })} />
            <input style={inputStyle} placeholder="Hint" value={wordForm.hint} onChange={e => setWordForm({ ...wordForm, hint: e.target.value })} />
            <input style={inputStyle} placeholder="Notes" value={wordForm.notes} onChange={e => setWordForm({ ...wordForm, notes: e.target.value })} />
            <button style={{ ...styles.button, background: theme.primary, color: theme.primaryText }} onClick={handleCreateWord}>Add Word</button>
          </div>
          {wordFormError && <div style={styles.errorText}>{wordFormError}</div>}

          <div style={styles.list}>
            {words.map(w => (
              <div key={w.id} style={{ ...styles.listItem, background: theme.surface, color: theme.text }}>
                {editingWord === w.id ? (
                  <div style={styles.editWordForm}>
                    <input style={inputStyle} placeholder="Word *" value={editWordForm.word} onChange={e => setEditWordForm({ ...editWordForm, word: e.target.value })} />
                    <input style={inputStyle} placeholder="Translation" value={editWordForm.translation} onChange={e => setEditWordForm({ ...editWordForm, translation: e.target.value })} />
                    <input style={inputStyle} placeholder="Hint" value={editWordForm.hint} onChange={e => setEditWordForm({ ...editWordForm, hint: e.target.value })} />
                    <input style={inputStyle} placeholder="Notes" value={editWordForm.notes} onChange={e => setEditWordForm({ ...editWordForm, notes: e.target.value })} />
                    <div style={styles.inlineEditRow}>
                      <button style={styles.saveButton} onClick={() => handleUpdateWord(w.id)}>Save</button>
                      <button style={styles.cancelButton} onClick={() => setEditingWord(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.itemRow}>
                    <span style={{ ...styles.itemLabel, color: theme.text }}>
                      <strong>{w.word}</strong>
                      {w.translation && ` — ${w.translation}`}
                      {w.hint && <em> (hint: {w.hint})</em>}
                    </span>
                    <div style={styles.itemActions}>
                      <button style={{ ...styles.editButton, background: theme.surfaceAlt, border: `1px solid ${theme.border}`, color: theme.text }} onClick={() => { setEditingWord(w.id); setEditWordForm({ word: w.word, translation: w.translation || '', hint: w.hint || '', notes: w.notes || '' }); }}>Edit</button>
                      <button style={styles.deleteButton} onClick={() => handleDeleteWord(w.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Session options */}
          <div style={styles.sessionOptions}>
            <div style={styles.sessionTypeRow}>
              <span style={{ ...styles.sessionLabel, color: theme.text }}>Session type:</span>
              <div style={styles.sessionToggleRow}>
                {['alternating', 'teacher_only', 'student_only'].map(type => (
                  <button
                    key={type}
                    style={{
                      ...styles.toggleButton,
                      background: sessionType === type ? theme.primary : theme.surfaceAlt,
                      color: sessionType === type ? theme.primaryText : theme.text
                    }}
                    onClick={() => setSessionType(type)}
                  >
                    {type === 'alternating' ? '🔄 Alternating' : type === 'teacher_only' ? '👩‍🏫 Teacher Only' : '🧑‍🎓 Student Only'}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.shuffleRow}>
              <span style={{ ...styles.sessionLabel, color: theme.text }}>Shuffle words:</span>
              <button
                style={{
                  ...styles.toggleButton,
                  background: shuffled ? theme.success : theme.surfaceAlt,
                  color: shuffled ? theme.primaryText : theme.text
                }}
                onClick={() => setShuffled(!shuffled)}
              >
                {shuffled ? '🔀 Shuffle On' : '🔀 Shuffle Off'}
              </button>
            </div>
          </div>

          <button style={{ ...styles.button, marginTop: 16, background: theme.success, color: theme.primaryText }} onClick={handleCreateSession}>
            Start Session with {selectedStudent.name}
          </button>

          {sessionLink && (
            <div style={{ ...styles.sessionLink, background: theme.successBg, border: `1px solid ${theme.successBorder}` }}>
              <p style={{ color: theme.text }}>Share this link with {selectedStudent.name}:</p>
              <a href={sessionLink} target="_blank" rel="noreferrer" style={{ color: theme.primary }}>{sessionLink}</a>
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
  welcomeText: { fontSize: 14 },
  logoutButton: { padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  toggleRow: { display: 'flex', gap: 8, marginBottom: 24 },
  sessionToggleRow: { display: 'flex', gap: 8 },
  toggleButton: { padding: '8px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14 },
  authForm: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 },
  section: { marginTop: 32, paddingTop: 24 },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  input: { padding: '8px 12px', borderRadius: 6, fontSize: 14 },
  button: { padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  listItem: { padding: '10px 14px', borderRadius: 6, fontSize: 14 },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemLabel: { cursor: 'pointer', flex: 1 },
  itemActions: { display: 'flex', gap: 6 },
  editButton: { padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  deleteButton: { padding: '4px 10px', borderRadius: 4, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', fontSize: 12, color: '#dc2626' },
  saveButton: { padding: '4px 10px', borderRadius: 4, background: '#dcfce7', border: '1px solid #86efac', cursor: 'pointer', fontSize: 12, color: '#16a34a' },
  cancelButton: { padding: '4px 10px', borderRadius: 4, background: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, color: '#374151' },
  duplicateButton: { padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  associateButton: { padding: '4px 10px', borderRadius: 4, background: '#dcfce7', border: '1px solid #86efac', cursor: 'pointer', fontSize: 12, color: '#16a34a' },
  inlineEditRow: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  editWordForm: { display: 'flex', flexDirection: 'column', gap: 8 },
  twoCols: { display: 'flex', gap: 24 },
  col: { flex: 1, minWidth: 0 },
  colTitle: { fontSize: 15, fontWeight: 600, marginBottom: 12 },
  scrollPanel: { height: 300, overflowY: 'auto', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 },
  panelItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 6, fontSize: 14 },
  panelItemName: { flex: 1 },
  associatedStudents: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  studentTag: { display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 12 },
  unassociateButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1, padding: 0 },
  sessionLink: { marginTop: 16, padding: 16, borderRadius: 8 },
  errorText: { color: '#dc2626', fontSize: 14, marginBottom: 8 },
  sessionOptions: { marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  sessionTypeRow: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  shuffleRow: { display: 'flex', alignItems: 'center', gap: 12 },
  sessionLabel: { fontSize: 14, fontWeight: 600, minWidth: 100 },
  studentInfo: { display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1 },
  studentEmail: { fontSize: 12, marginTop: 2 },
  lastSession: { fontSize: 11, marginTop: 2 },
  panelItemInfo: { display: 'flex', flexDirection: 'column', flex: 1 },
  panelItemStudents: { fontSize: 11, marginTop: 2 },
  noResults: { padding: 16, textAlign: 'center', fontSize: 14 },
  oneCol: { display: 'flex', flexDirection: 'column', gap: 16 },
collapsibleHeader: { width: '100%', padding: '12px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none' },
};