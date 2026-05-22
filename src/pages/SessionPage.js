import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { joinSession, getWords, createWord } from '../api';

export default function SessionPage() {
  const { inviteToken } = useParams();

  const [session, setSession] = useState(null);
  const [words, setWords] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // Determine if this is the teacher based on localStorage
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const isTeacher = !!teacher;
  const myRole = isTeacher ? 'teacher' : 'student';

  const currentWord = session ? words[session.currentWordIndex] : null;
  const isMyTurn = session && session.currentTurn === myRole;

  useEffect(() => {
    const init = async () => {
      try {
        const res = await joinSession(inviteToken);
        const sessionData = res.data;
        setSession(sessionData);

        const wordsRes = await getWords(sessionData.wordBank.id);
        setWords(wordsRes.data);

        const client = new Client({
          webSocketFactory: () => new SockJS('http://192.168.0.165:8080/ws'),
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

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>{error}</div>
      </div>
    );
  }

  if (!session || !connected) {
    return (
      <div style={styles.container}>
        <div style={styles.statusBox}>Connecting to session...</div>
      </div>
    );
  }

  if (session.status === 'completed') {
    return (
      <CompletedScreen
        session={session}
        isTeacher={isTeacher}
        words={words}
      />
    );
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Flashify</h2>
        <span style={styles.badge}>
          {isTeacher ? '👩‍🏫 Teacher' : '🧑‍🎓 Student'}
        </span>
      </div>

      {/* Progress */}
      <div style={styles.progress}>
        Word {Math.min(session.currentWordIndex + 1, words.length)} of {words.length}
        <div style={styles.progressBar}>
          <div style={{
            ...styles.progressFill,
            width: `${(session.currentWordIndex / words.length) * 100}%`
          }} />
        </div>
      </div>

      {/* Word Card */}
      <div style={styles.card}>
        {currentWord ? (
          <>
            {/* Word — only visible to active player until revealed */}
            {isMyTurn || session.wordRevealed ? (
              <div style={styles.word}>{currentWord.word}</div>
            ) : (
              <div style={styles.hiddenWord}>🙈 Waiting for word...</div>
            )}

            {/* Translation — visible to both only after word is revealed */}
            {currentWord.translation && (isMyTurn || session.wordRevealed) && (
                <div style={styles.translation}>{currentWord.translation}</div>
            )}

            {/* Hint — visible to both when revealed */}
            {currentWord.hint && (
            <div style={styles.hintSection}>
                {session.hintRevealed ? (
                <div style={styles.hintText}>💡 {currentWord.hint}</div>
                ) : (
                <button style={styles.hintButton} onClick={handleRevealHint}>
                    Show Hint
                </button>
                )}
            </div>
            )}
          </>
        ) : (
          <div style={styles.word}>—</div>
        )}
      </div>

      {/* Turn indicator */}
      <div style={{
        ...styles.turnIndicator,
        background: isMyTurn ? '#dcfce7' : '#fef9c3'
      }}>
        {isMyTurn
          ? '✅ Your turn!'
          : `⏳ Waiting for ${session.currentTurn === 'teacher' ? 'teacher' : 'student'}...`
        }
      </div>

      {/* Action buttons — only shown to active player */}
      {isMyTurn && (
        <div style={styles.buttonGroup}>
          {!session.wordRevealed ? (
            <button style={styles.revealButton} onClick={handleRevealWord}>
              Reveal Word to Both
            </button>
          ) : (
            <button style={styles.nextButton} onClick={handleNextWord}>
              Next Word →
            </button>
          )}
        </div>
      )}

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
  title: { margin: 0, fontSize: 24 },
  badge: {
    padding: '4px 12px',
    background: '#e0e7ff',
    borderRadius: 20,
    fontSize: 14
  },
  progress: {
    width: '100%',
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8
  },
  progressBar: {
    width: '100%',
    height: 6,
    background: '#e5e7eb',
    borderRadius: 3,
    marginTop: 6
  },
  progressFill: {
    height: '100%',
    background: '#2563eb',
    borderRadius: 3,
    transition: 'width 0.3s ease'
  },
  card: {
    width: '100%',
    minHeight: 200,
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 24,
    marginBottom: 24
  },
  word: { fontSize: 48, fontWeight: 700, color: '#1e293b' },
  hiddenWord: { fontSize: 24, color: '#94a3b8' },
  translation: { fontSize: 20, color: '#64748b', marginTop: 8 },
  hintSection: { marginTop: 16 },
  hintText: {
    fontSize: 16,
    color: '#92400e',
    background: '#fef3c7',
    padding: '8px 16px',
    borderRadius: 8
  },
  hintButton: {
    padding: '8px 16px',
    background: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: '#92400e'
  },
  turnIndicator: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16
  },
  buttonGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  revealButton: {
    width: '100%',
    padding: 16,
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer'
  },
  nextButton: {
    width: '100%',
    padding: 16,
    background: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer'
  },
  errorBox: {
    padding: 24,
    background: '#fef2f2',
    borderRadius: 12,
    color: '#dc2626',
    fontSize: 16
  },
  statusBox: {
    padding: 24,
    background: '#f0f9ff',
    borderRadius: 12,
    color: '#0284c7',
    fontSize: 16
  },
  completedBox: {
    textAlign: 'center',
    padding: 48,
    background: '#f0fdf4',
    borderRadius: 16,
    border: '1px solid #86efac'
  },
  subtext: { color: '#6b7280', fontSize: 16 },

  dashboardButton: {
  marginTop: 16,
  padding: '10px 20px',
  background: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  cursor: 'pointer'
},
addWordBox: {
  width: '100%',
  marginTop: 32,
  padding: 24,
  background: 'white',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
},
addWordForm: {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  marginTop: 16
},
input: {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  fontSize: 14
},
successMessage: {
  padding: '8px 12px',
  background: '#f0fdf4',
  borderRadius: 6,
  color: '#16a34a',
  fontSize: 14,
  textAlign: 'center'
},
addedWordsList: {
  marginTop: 24,
  borderTop: '1px solid #e5e7eb',
  paddingTop: 16
},
addedWordItem: {
  padding: '8px 0',
  fontSize: 14,
  borderBottom: '1px solid #f3f4f6'
}
};

function CompletedScreen({ session, isTeacher, words }) {
  const [wordForm, setWordForm] = useState({
    word: '', translation: '', hint: '', notes: ''
  });
  const [addedWords, setAddedWords] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
    <div style={styles.container}>
      <div style={styles.completedBox}>
        <h1>🎉 Session Complete!</h1>
        <p>All {words.length} words have been revealed.</p>
        <p style={styles.subtext}>Great work!</p>

        {isTeacher && (
          <button
            style={styles.dashboardButton}
            onClick={() => window.location.href = '/'}
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      {/* Add words form */}
      <div style={styles.addWordBox}>
        <h2>➕ Add Words to Word Bank</h2>
        <p style={styles.subtext}>
          Add new words to <strong>{session.wordBank.name}</strong> for next time
        </p>

        <div style={styles.addWordForm}>
          <input
            style={styles.input}
            placeholder="Word *"
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
          <button
            style={{
              ...styles.revealButton,
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
            onClick={handleAddWord}
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Word'}
          </button>

          {success && (
            <div style={styles.successMessage}>✅ Word added!</div>
          )}
        </div>

        {/* List of newly added words */}
        {addedWords.length > 0 && (
          <div style={styles.addedWordsList}>
            <h3>Added this session:</h3>
            {addedWords.map(w => (
              <div key={w.id} style={styles.addedWordItem}>
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