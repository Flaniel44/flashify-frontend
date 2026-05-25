import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { joinSession, getSessionWords, createWord } from '../api';
import { useTheme } from '../context/ThemeContext';

export default function SessionPage() {
  const { inviteToken } = useParams();

  const [session, setSession] = useState(null);
  const [words, setWords] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [emptyWordBank, setEmptyWordBank] = useState(false);

  const { theme } = useTheme();

  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const isTeacher = !!teacher;
  const myRole = isTeacher ? 'teacher' : 'student';

  const currentWord = session ? words[session.currentWordIndex] : null;
  const isMyTurn = session && (
    session.sessionType === 'teacher_only' ? isTeacher :
    session.sessionType === 'student_only' ? !isTeacher :
    session.currentTurn === myRole
  );

  useEffect(() => {
    const init = async () => {
      try {
        const res = await joinSession(inviteToken);
        const sessionData = res.data;
        setSession(sessionData);

        const wordsRes = await getSessionWords(sessionData.id);
        setWords(wordsRes.data);

        if (wordsRes.data.length === 0) {
          setEmptyWordBank(true);
          return;
        }

        const client = new Client({
          webSocketFactory: () => new SockJS(`${process.env.REACT_APP_WS_URL}/ws`),
          onConnect: () => {
            setConnected(true);
            client.subscribe(`/topic/session/${sessionData.id}`, (message) => {
              const updatedSession = JSON.parse(message.body);
              setSession(updatedSession);
            });
          },
          onDisconnect: () => setConnected(false),
          onStompError: () => setError('Connection error. Please refresh.')
        });

        client.activate();
        setStompClient(client);
      } catch (err) {
        setError('Session not found. Please check your link.');
      }
    };

    init();

    return () => {
      if (stompClient) stompClient.deactivate();
    };
  }, [inviteToken]);

  const sendMessage = useCallback((destination, body = {}) => {
    if (!stompClient || !connected) return;
    stompClient.publish({
      destination: `/app/session/${session.id}/${destination}`,
      body: JSON.stringify(body)
    });
  }, [stompClient, connected, session]);

  const handleRevealWord = () => sendMessage('reveal', { revealedBy: myRole });
  const handleRevealHint = () => sendMessage('hint');
  const handleNextWord = () => sendMessage('next', { currentTurn: session.currentTurn });
  const handleEndSession = () => {
    if (window.confirm('End this session early?')) {
      sendMessage('end');
    }
  };

  if (error) {
    return (
      <div style={{ ...styles.container, background: theme.background }}>
        <div style={{ ...styles.errorBox, background: theme.errorBg, color: theme.error, border: `1px solid ${theme.errorBorder}` }}>
          {error}
        </div>
      </div>
    );
  }

  if (emptyWordBank) {
    return (
      <CompletedScreen
        session={session || { wordBank: { id: null, name: 'Word Bank' } }}
        isTeacher={isTeacher}
        words={[]}
        emptyBank={true}
        theme={theme}
      />
    );
  }

  if (!session || !connected) {
    return (
      <div style={{ ...styles.container, background: theme.background }}>
        <div style={{ ...styles.statusBox, background: theme.surface, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
          Connecting to session...
        </div>
      </div>
    );
  }

  if (session.status === 'completed') {
    return (
      <CompletedScreen
        session={session}
        isTeacher={isTeacher}
        words={words}
        theme={theme}
      />
    );
  }

  return (
    <div style={{ ...styles.container, background: theme.background, color: theme.text }}>

      {/* Header */}
      <div style={styles.header}>
        <h2 style={{ margin: 0, fontSize: 24, color: theme.text }}>Flashify</h2>
        <span style={{ ...styles.badge, background: theme.badge, color: theme.text }}>
          {isTeacher ? '👩‍🏫 Teacher' : '🧑‍🎓 Student'}
        </span>
      </div>

      {/* Progress */}
      <div style={{ ...styles.progress, color: theme.textMuted }}>
        Word {Math.min(session.currentWordIndex + 1, words.length)} of {words.length}
        <div style={{ ...styles.progressBar, background: theme.border }}>
          <div style={{
            ...styles.progressFill,
            width: `${(session.currentWordIndex / words.length) * 100}%`,
            background: theme.primary
          }} />
        </div>
      </div>

      {/* Word Card */}
      <div style={{ ...styles.card, background: theme.surface, boxShadow: theme.cardShadow }}>
        {currentWord ? (
          <>
            {isMyTurn || session.wordRevealed ? (
              <div style={{ ...styles.word, color: theme.text }}>{currentWord.word}</div>
            ) : (
              <div style={{ ...styles.hiddenWord, color: theme.textLight }}>🙈 Waiting for word...</div>
            )}

            {currentWord.translation && (isMyTurn || session.wordRevealed) && (
              <div style={{ ...styles.translation, color: theme.textMuted }}>{currentWord.translation}</div>
            )}

            {currentWord.hint && (
              <div style={styles.hintSection}>
                {session.hintRevealed ? (
                  <div style={{ ...styles.hintText, background: theme.surfaceAlt, color: theme.text }}>
                    💡 {currentWord.hint}
                  </div>
                ) : (
                  <button
                    style={{ ...styles.hintButton, background: theme.surfaceAlt, border: `1px solid ${theme.border}`, color: theme.text }}
                    onClick={handleRevealHint}
                  >
                    Show Hint
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ ...styles.word, color: theme.text }}>—</div>
        )}
      </div>

      {/* Turn indicator */}
      <div style={{
        ...styles.turnIndicator,
        background: isMyTurn ? theme.successBg : theme.warning,
        color: theme.text,
        border: `1px solid ${isMyTurn ? theme.successBorder : theme.border}`
      }}>
        {isMyTurn
          ? '✅ Your turn!'
          : session.sessionType === 'teacher_only'
            ? '⏳ Waiting for teacher...'
            : session.sessionType === 'student_only'
              ? '⏳ Waiting for student...'
              : `⏳ Waiting for ${session.currentTurn === 'teacher' ? 'teacher' : 'student'}...`
        }
      </div>

      {/* Action buttons */}
      {isMyTurn && (
        <div style={styles.buttonGroup}>
          {!session.wordRevealed ? (
            <button style={{ ...styles.actionButton, background: theme.primary }} onClick={handleRevealWord}>
              Reveal Word to Both
            </button>
          ) : (
            <button style={{ ...styles.actionButton, background: theme.success }} onClick={handleNextWord}>
              Next Word →
            </button>
          )}
        </div>
      )}

      <div style={styles.buttonGroup}>
        <button style={styles.endButton} onClick={handleEndSession}>
          End Session Early
        </button>
      </div>

    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: '0 auto',
    padding: 32,
    fontFamily: 'sans-serif',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  badge: { padding: '4px 12px', borderRadius: 20, fontSize: 14 },
  progress: { width: '100%', fontSize: 14, marginBottom: 8 },
  progressBar: { width: '100%', height: 6, borderRadius: 3, marginTop: 6 },
  progressFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s ease' },
  card: {
    width: '100%',
    minHeight: 200,
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 24,
    marginBottom: 24
  },
  word: { fontSize: 48, fontWeight: 700 },
  hiddenWord: { fontSize: 24 },
  translation: { fontSize: 20, marginTop: 8 },
  hintSection: { marginTop: 16 },
  hintText: { fontSize: 16, padding: '8px 16px', borderRadius: 8 },
  hintButton: { padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  turnIndicator: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16
  },
  buttonGroup: { width: '100%', display: 'flex', flexDirection: 'column', gap: 12 },
  actionButton: {
    width: '100%',
    padding: 16,
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer'
  },
  errorBox: { padding: 24, borderRadius: 12, fontSize: 16 },
  statusBox: { padding: 24, borderRadius: 12, fontSize: 16 },
  endButton: {
    width: '100%',
    padding: '10px',
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    marginTop: 12
  },
  completedBox: { textAlign: 'center', padding: 48, borderRadius: 16 },
  subtext: { fontSize: 16 },
  dashboardButton: { marginTop: 16, padding: '10px 20px', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
  addWordBox: { width: '100%', marginTop: 32, padding: 24, borderRadius: 16 },
  addWordForm: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 },
  input: { padding: '8px 12px', borderRadius: 6, fontSize: 14 },
  successMessage: { padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, color: '#16a34a', fontSize: 14, textAlign: 'center' },
  addedWordsList: { marginTop: 24, paddingTop: 16 },
  addedWordItem: { padding: '8px 0', fontSize: 14 },
  actionButtonSm: { width: '100%', padding: 16, color: 'white', border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 600, cursor: 'pointer' }
};

function CompletedScreen({ session, isTeacher, words, emptyBank, theme }) {
  const [wordForm, setWordForm] = useState({ word: '', translation: '', hint: '', notes: '' });
  const [addedWords, setAddedWords] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputStyle = {
    ...styles.input,
    background: theme.background,
    color: theme.text,
    border: `1px solid ${theme.border}`
  };

  const handleAddWord = async () => {
    if (!wordForm.word.trim()) return;
    setSubmitting(true);
    try {
      const res = await createWord(
        session.wordBank.id,
        wordForm.word,
        wordForm.translation,
        wordForm.hint,
        wordForm.notes
      );
      setAddedWords([...addedWords, res.data]);
      setWordForm({ word: '', translation: '', hint: '', notes: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to add word', err);
    }
    setSubmitting(false);
  };

  return (
    <div style={{ ...styles.container, background: theme.background, color: theme.text }}>

      <div style={{ ...styles.completedBox, background: theme.successBg, border: `1px solid ${theme.successBorder}` }}>
        {emptyBank ? (
          <>
            <h1 style={{ color: theme.text }}>⚠️ No Words Found</h1>
            <p style={{ color: theme.textMuted }}>This word bank is empty. Add some words below before starting a session!</p>
          </>
        ) : (
          <>
            <h1 style={{ color: theme.text }}>🎉 Session Complete!</h1>
            <p style={{ color: theme.textMuted }}>All {words.length} words have been revealed.</p>
            <p style={{ ...styles.subtext, color: theme.textMuted }}>Great work!</p>
          </>
        )}

        {isTeacher && (
          <button
            style={{ ...styles.dashboardButton, background: theme.primary }}
            onClick={() => window.location.href = '/'}
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      <div style={{ ...styles.addWordBox, background: theme.surface, boxShadow: theme.cardShadow }}>
        <h2 style={{ color: theme.text }}>➕ Add Words to Word Bank</h2>
        <p style={{ color: theme.textMuted }}>
          Add new words to <strong>{session.wordBank.name}</strong> for next time
        </p>

        <div style={styles.addWordForm}>
          <input style={inputStyle} placeholder="Word *" value={wordForm.word} onChange={e => setWordForm({ ...wordForm, word: e.target.value })} />
          <input style={inputStyle} placeholder="Translation" value={wordForm.translation} onChange={e => setWordForm({ ...wordForm, translation: e.target.value })} />
          <input style={inputStyle} placeholder="Hint" value={wordForm.hint} onChange={e => setWordForm({ ...wordForm, hint: e.target.value })} />
          <input style={inputStyle} placeholder="Notes" value={wordForm.notes} onChange={e => setWordForm({ ...wordForm, notes: e.target.value })} />
          <button
            style={{ ...styles.actionButtonSm, background: theme.primary, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            onClick={handleAddWord}
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Word'}
          </button>

          {success && <div style={styles.successMessage}>✅ Word added!</div>}
        </div>

        {addedWords.length > 0 && (
          <div style={{ ...styles.addedWordsList, borderTop: `1px solid ${theme.border}` }}>
            <h3 style={{ color: theme.text }}>Added this session:</h3>
            {addedWords.map(w => (
              <div key={w.id} style={{ ...styles.addedWordItem, borderBottom: `1px solid ${theme.border}`, color: theme.text }}>
                <strong>{w.word}</strong>
                {w.translation && ` — ${w.translation}`}
                {w.hint && <em> (hint: {w.hint})</em>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}