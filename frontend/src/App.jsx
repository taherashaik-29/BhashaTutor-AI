import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'

const STORAGE_KEY = 'bhashaTutorChats'

function createChat() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'New Chat',
    language: 'English',
    messages: [],
  }
}

function loadChats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : []

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch (error) {
    console.error('Could not load saved chats:', error)
  }

  return [createChat()]
}

function App() {
 const [quiz, setQuiz] = useState([])
 const [quizLoading, setQuizLoading] = useState(false)
 const [quizError, setQuizError] = useState('')
 const [selectedAnswers, setSelectedAnswers] = useState({})
 const [quizSubmitted, setQuizSubmitted] = useState(false)
 const [initialChats] = useState(() => loadChats())
 const [chats, setChats] = useState(initialChats)
 const [activeChatId, setActiveChatId] = useState(
    initialChats[0]?.id
  )

  const [question, setQuestion] = useState('')
  const [language, setLanguage] = useState('English')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [pdfFile, setPdfFile] = useState(null)
  const [pdfStatus, setPdfStatus] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfUploaded, setPdfUploaded] = useState(false)
  const [notes, setNotes] = useState('')
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState('')

  const [showHistory, setShowHistory] = useState(true)
  const [searchHistory, setSearchHistory] = useState('')

  // Search chat titles and message content.
  const filteredChats = chats.filter((chat) => {
    const searchText = searchHistory.trim().toLowerCase()

    if (!searchText) return true

    return (
      chat.title.toLowerCase().includes(searchText) ||
      chat.messages.some((message) =>
        message.content.toLowerCase().includes(searchText)
      )
    )
  })

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  )
  const messages = activeChat?.messages || []

  // Save chat history in this browser.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
      )
    } catch (error) {
      console.error('Could not save chat history:', error)
      setError('Unable to save chat history in this browser.')
    }
  }, [chats])

  // Restore the language associated with the selected chat.
  useEffect(() => {
    const selectedChat = chats.find(
      (chat) => chat.id === activeChatId
    )

    if (selectedChat) {
      setLanguage(selectedChat.language || 'English')
    }
  }, [activeChatId, chats])

  const updateChat = (chatId, updater) => {
    setChats((previous) =>
      previous.map((chat) =>
        chat.id === chatId ? updater(chat) : chat
      )
    )
  }

  const startNewChat = () => {
    const newChat = createChat()

    setChats((previous) => [newChat, ...previous])
    setActiveChatId(newChat.id)
    setQuestion('')
    setError('')
    setPdfStatus('')
    setPdfFile(null)
    setPdfUploaded(false)
    setSearchHistory('')
  }

  const openChat = (chat) => {
    setActiveChatId(chat.id)
    setQuestion('')
    setError('')
  }

  const changeLanguage = (selectedLanguage) => {
    setLanguage(selectedLanguage)

    updateChat(activeChatId, (chat) => ({
      ...chat,
      language: selectedLanguage,
    }))
  }

  const askAI = async () => {
    if (!question.trim() || loading || !activeChatId) {
      return
    }

    const askedQuestion = question.trim()
    const selectedLanguage = language
    const chatId = activeChatId

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: askedQuestion,
    }

    setLoading(true)
    setError('')
    setQuestion('')

    updateChat(chatId, (chat) => ({
      ...chat,
      title:
        chat.messages.length === 0
          ? askedQuestion.slice(0, 45) +
            (askedQuestion.length > 45 ? '…' : '')
          : chat.title,
      language: selectedLanguage,
      messages: [...chat.messages, userMessage],
    }))

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/ask',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: askedQuestion,
            language: selectedLanguage,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(
          data.detail || data.error || 'Unable to get an answer.'
        )
      }

      const answerText =
        data.answer || 'No answer received. Please try again.'

      updateChat(chatId, (chat) => ({
        ...chat,
        messages: [
          ...chat.messages,
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content: answerText,
          },
        ],
      }))
    } catch (err) {
      setError(
        err.message || 'Could not connect to the AI backend.'
      )
    } finally {
      setLoading(false)
    }
  }

  const uploadPDF = async () => {
    if (!pdfFile) {
      setPdfStatus('Please select a PDF file first.')
      return
    }

    setPdfLoading(true)
    setPdfStatus('Uploading and reading your PDF...')
    setPdfUploaded(false)
    setNotes('')
    setNotesError('')

    const formData = new FormData()
    formData.append('file', pdfFile)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/upload-pdf',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'PDF upload failed.')
      }

      setPdfUploaded(true)
      setPdfStatus(
        `✅ ${data.filename} uploaded successfully! ${data.pages} pages detected.`
      )
    } catch (err) {
      setPdfStatus(`❌ ${err.message}`)
    } finally {
      setPdfLoading(false)
    }
  }

   const generateNotes = async () => {
    if (!pdfUploaded || notesLoading) {
      return
    }

    setNotesLoading(true)
    setNotesError('')
    setNotes('')

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/generate-notes',
        { method: 'POST' }
      )
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400) {
          setPdfUploaded(false)
        }
        throw new Error(data.detail || 'Could not generate study notes.')
      }

      setNotes(data.notes || 'No notes were returned. Please try again.')
    } catch (err) {
      setNotesError(err.message || 'Could not connect to the AI backend.')
    } finally {
      setNotesLoading(false)
    }
  }

  const generateQuiz = async () => {
    if (!pdfUploaded || quizLoading) {
      return
    }

    setQuizLoading(true)
    setQuizError('')
    setQuiz([])
    setSelectedAnswers({})
    setQuizSubmitted(false)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/generate-quiz',
        { method: 'POST' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Could not generate quiz.')
      }

      setQuiz(data.questions || [])
    } catch (err) {
      setQuizError(err.message || 'Could not connect to the AI backend.')
    } finally {
      setQuizLoading(false)
    }
  }


  const deleteChat = (event, chatId) => {
    event.stopPropagation()

    const remaining = chats.filter(
      (chat) => chat.id !== chatId
    )

    if (remaining.length === 0) {
      const freshChat = createChat()
      setChats([freshChat])
      setActiveChatId(freshChat.id)
    } else {
      setChats(remaining)

      if (activeChatId === chatId) {
        setActiveChatId(remaining[0].id)
      }
    }

    setQuestion('')
    setError('')
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">📘 BhashaTutor AI</div>
        <span className="nav-tagline">
          Learn in your language
        </span>
      </nav>

      <main>
        <section className="hero">
          <h1>Learn Technical Subjects in Your Language</h1>
          <p>
            Your AI tutor for engineering concepts in English,
            Telugu, and Hindi. Ask questions or learn from your PDF notes.
          </p>
        </section>

        <section className="history-panel">
          <div className="history-toolbar">
            <h2>💬 Your Conversations</h2>

            <button
              type="button"
              className="new-chat-button"
              onClick={startNewChat}
              disabled={loading}
            >
              + New Chat
            </button>
          </div>

          <button
            type="button"
            className="history-toggle"
            onClick={() => setShowHistory((previous) => !previous)}
          >
            {showHistory ? 'Hide history ▲' : 'Show history ▼'}
            <span>{chats.length} chats</span>
          </button>

          {showHistory && (
            <>
              <div className="history-search">
                <span aria-hidden="true">🔍</span>

                <input
                  type="search"
                  value={searchHistory}
                  onChange={(event) =>
                    setSearchHistory(event.target.value)
                  }
                  placeholder="Search chats by title or question..."
                  aria-label="Search chat history"
                />

                {searchHistory && (
                  <button
                    type="button"
                    className="clear-search-button"
                    onClick={() => setSearchHistory('')}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="history-list">
                {filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`history-item ${
                        chat.id === activeChatId ? 'active' : ''
                      }`}
                    >
                      <button
                        type="button"
                        className="history-open"
                        onClick={() => openChat(chat)}
                        title={chat.title}
                      >
                        <span className="history-chat-title">
                          {chat.title}
                        </span>

                        <span className="history-chat-meta">
                          {chat.messages.length} messages · {chat.language}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="delete-chat-button"
                        onClick={(event) =>
                          deleteChat(event, chat.id)
                        }
                        aria-label={`Delete ${chat.title}`}
                        title="Delete chat"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="history-empty">
                    No conversations match “{searchHistory}”.
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        <section className="chat-container">
          <h2>🤖 Ask Your AI Tutor</h2>

          <p className="current-chat-title">
            Current chat: {activeChat?.title || 'New Chat'}
          </p>

          <label htmlFor="language">
            Choose your language
          </label>

          <select
            id="language"
            className="language-select"
            value={language}
            onChange={(event) =>
              changeLanguage(event.target.value)
            }
          >
            <option value="English">English</option>
            <option value="Telugu">తెలుగు (Telugu)</option>
            <option value="Hindi">हिन्दी (Hindi)</option>
          </select>

          {messages.length > 0 && (
            <div className="chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${
                    message.role === 'user'
                      ? 'user-message'
                      : 'ai-message'
                  }`}
                >
                  <strong>
                    {message.role === 'user'
                      ? 'You'
                      : '🤖 BhashaTutor AI'}
                  </strong>

                  {message.role === 'user' ? (
                    <p>{message.content}</p>
                  ) : (
                    <div className="markdown-answer">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {loading && (
            <p className="loading-message">
              AI is thinking...
            </p>
          )}

          {error && (
            <p className="error-message">{error}</p>
          )}

          <label htmlFor="question">Your question</label>

          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                askAI()
              }
            }}
            placeholder="Ask a technical question... (Enter to send, Shift+Enter for a new line)"
            rows={4}
          />

          <button
            type="button"
            className="ask-button"
            onClick={askAI}
            disabled={loading || !question.trim()}
          >
            {loading ? 'Thinking...' : 'Ask AI ✨'}
          </button>
        </section>

        <section className="pdf-upload">
          <h2>📚 Learn from Your PDF</h2>
          <p>
            Upload engineering notes and ask questions about the document.
          </p>

          <label htmlFor="pdf-file">
            Choose a PDF file (maximum 10 MB)
          </label>

          <input
            id="pdf-file"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => {
              setPdfFile(event.target.files?.[0] || null)
              setPdfStatus('')
              setPdfUploaded(false)
              setNotes('')
              setNotesError('')
            }}
          />

          {pdfFile && (
            <p className="selected-file">
              Selected: {pdfFile.name}
            </p>
          )}

          <button
            type="button"
            className="upload-button"
            onClick={uploadPDF}
            disabled={pdfLoading || !pdfFile}
          >
            {pdfLoading ? 'Uploading...' : 'Upload PDF 📄'}
          </button>

          <button
            type="button"
            className="upload-button"
            onClick={generateNotes}
            disabled={!pdfUploaded || pdfLoading || notesLoading}
          >
            {notesLoading ? 'Generating notes...' : 'Generate study notes'}
          </button>
          
<button
  type="button"
  className="upload-button"
  onClick={generateQuiz}
  disabled={!pdfUploaded || pdfLoading || quizLoading}
>
  {quizLoading ? 'Generating quiz...' : 'Generate Quiz 📝'}
</button>

{quizError && (
  <p className="pdf-status pdf-generation-error" role="alert">
    {quizError}
  </p>
)}


          {pdfStatus && (
            <p className="pdf-status" aria-live="polite">
              {pdfStatus}
            </p>
          )}

          {pdfUploaded && (
            <p className="pdf-hint">
              Ask your questions in the AI Tutor section above.
            </p>
          )}

          {notesError && (
            <p className="pdf-status pdf-generation-error" role="alert">
              {notesError}
            </p>
          )}

          {notes && (
            <div className="generated-notes">
              <h3>Study notes</h3>
              <div className="markdown-answer">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {notes}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
{quiz.length > 0 && (
  <div className="generated-notes">
    <h3>📝 Practice Quiz</h3>

    {quiz.map((item, index) => (
      <div className="quiz-question" key={index}>
        <h4>
          {index + 1}. {item.question}
        </h4>

        {item.options.map((option, optionIndex) => (
          <label
            key={optionIndex}
            className="quiz-option"
          >
            <input
              type="radio"
              name={`question-${index}`}
              checked={selectedAnswers[index] === optionIndex}
              disabled={quizSubmitted}
              onChange={() =>
                setSelectedAnswers((previous) => ({
                  ...previous,
                  [index]: optionIndex,
                }))
              }
            />
            {option}
          </label>
        ))}

        {quizSubmitted && (
          <div>
            <p>
              Correct answer: {item.options[item.answer]}
            </p>
            <p>{item.explanation}</p>
          </div>
        )}
      </div>
    ))}

    {!quizSubmitted ? (
      <button
        type="button"
        className="upload-button"
        onClick={() => setQuizSubmitted(true)}
        disabled={Object.keys(selectedAnswers).length !== quiz.length}
      >
        Submit Quiz
      </button>
    ) : (
      <h3>
        Your Score: {quiz.filter(
          (item, index) => selectedAnswers[index] === item.answer
        ).length} / {quiz.length}
      </h3>
    )}
  </div>
)}

        </section>

        <section className="features">
          <h2>What You Can Do</h2>

          <div className="features-grid">
            <div className="feature-card">
              <span>🌐</span>
              <h3>Multilingual Learning</h3>
              <p>Learn in English, Telugu, or Hindi.</p>
            </div>

            <div className="feature-card">
              <span>🧠</span>
              <h3>Simple Explanations</h3>
              <p>Understand technical topics with examples.</p>
            </div>

            <div className="feature-card">
              <span>📄</span>
              <h3>PDF Learning</h3>
              <p>Upload notes and ask questions about them.</p>
            </div>
          </div>
        </section>
      </main>
const generateNotes
      <footer className="footer">
        BhashaTutor AI · Learn without language barriers 💙
      </footer>
    </div>
  )
}

export default App