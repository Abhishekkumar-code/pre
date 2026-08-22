import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useSelector } from 'react-redux'
import { useChat } from '../hooks/useChat'
import remarkGfm from 'remark-gfm'
import { Paperclip, X, ArrowUp, Plus, MessageSquare, Menu, FileText, Loader2 } from 'lucide-react'

const Dashboard = () => {
  const chat = useChat()
  const [chatInput, setChatInput] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [selectedPdf, setSelectedPdf] = useState(null)       // NEW
  const [pdfUploading, setPdfUploading] = useState(false)    // NEW
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const fileInputRef = useRef(null)
  const pdfInputRef = useRef(null)                            // NEW
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)

  const chats = useSelector((state) => state.chat.chats)
  const currentchatId = useSelector((state) => state.chat.currentchatId)
  const isLoading = useSelector((state) => state.chat.isLoading)

  const chatList = Object.values(chats).sort(
    (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
  )
  const activeMessages = chats[currentchatId]?.messages || []

  useEffect(() => {
    chat.initializedsocketconnection()
    chat.handleGetChats()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  // auto-grow textarea
  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
  }, [chatInput])

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    setImagePreviewUrl(URL.createObjectURL(file))
    event.target.value = ''
  }

  const removeSelectedImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setSelectedImage(null)
    setImagePreviewUrl(null)
  }

  // NEW: PDF is uploaded immediately on selection, not queued with the next message
  const handlePdfSelect = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!currentchatId) {
      // no chat yet — create one the same way sendmessage does implicitly,
      // by requiring a chat to exist first. Simplest: block and tell user.
      alert('Start a chat with a text message first, then attach a PDF.')
      return
    }

    setSelectedPdf(file)
    setPdfUploading(true)

    try {
      await chat.uploadPdfHandler({ file, chatId: currentchatId })
    } catch (err) {
      console.error('PDF upload failed', err)
      alert('Failed to process PDF. Please try again.')
      setSelectedPdf(null)
    } finally {
      setPdfUploading(false)
    }
  }

  const removeSelectedPdf = () => {
    setSelectedPdf(null)
  }

  const handleSubmitMessage = (event) => {
    event.preventDefault()
    const trimmedMessage = chatInput.trim()
    if (!trimmedMessage && !selectedImage) return

    chat.sendmessagehandler({
      message: trimmedMessage,
      chatId: currentchatId,
      image: selectedImage,
    })

    setChatInput('')
    removeSelectedImage()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmitMessage(event)
    }
  }

  const openChat = (chatId) => {
    chat.handleOpenChat(chatId, chats)
    setSidebarOpen(false)
  }

  const handleNewChat = () => {
    chat.startnewchat?.()
    setChatInput('')
    removeSelectedImage()
    removeSelectedPdf() // NEW
    setSidebarOpen(false)
  }

  const formatRelativeTime = (iso) => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const SidebarContent = (
    <>
      <div className='mb-5 flex items-center gap-2 px-1'>
        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C86FF]/15'>
          <MessageSquare size={16} className='text-[#7C86FF]' />
        </div>
        <h1 className='text-xl font-semibold tracking-tight text-white'>Perplexity</h1>
      </div>

      <button
        onClick={handleNewChat}
        type='button'
        className='mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#7C86FF]/40 bg-[#7C86FF]/10 px-3 py-2.5 text-sm font-medium text-[#c3c8ff] transition hover:border-[#7C86FF]/70 hover:bg-[#7C86FF]/15'
      >
        <Plus size={16} />
        New chat
      </button>

      <div className='flex-1 space-y-1 overflow-y-auto'>
        {chatList.length === 0 && (
          <p className='px-2 py-4 text-center text-xs text-[#63666f]'>No conversations yet</p>
        )}

        {chatList.map((c) => {
          const isActive = c.id === currentchatId
          return (
            <button
              key={c.id}
              onClick={() => openChat(c.id)}
              type='button'
              className={`group relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                isActive ? 'bg-white/[0.06] text-white' : 'text-[#9a9da5] hover:bg-white/[0.03] hover:text-[#d5d6db]'
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full transition ${
                  isActive ? 'bg-[#7C86FF] shadow-[0_0_8px_#7C86FF]' : 'bg-transparent'
                }`}
              />
              <span className='truncate pl-1'>{(c.title || 'New Chat').replace(/\*\*/g, '')}</span>
              <span className='ml-auto shrink-0 text-[10px] text-[#5c5f68]'>{formatRelativeTime(c.lastUpdated)}</span>
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <main className=' main  flex h-screen w-full overflow-hidden bg-[#0a0b0f] text-[#e8e9ed]'>

      {/* Desktop sidebar */}
      <aside className='hidden h-full w-72 shrink-0 flex-col border-r border-[#1a1c22] bg-[#101218] p-4 md:flex'>
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className='fixed inset-0 z-40 md:hidden'>
          <div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setSidebarOpen(false)}
          />
          <aside className='absolute left-0 top-0 flex h-full w-72 flex-col bg-[#101218] p-4 shadow-2xl animate-in slide-in-from-left duration-200'>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <section className='relative flex h-full min-w-0 flex-1 flex-col'>

        {/* Mobile top bar */}
        <div className='flex items-center gap-3 border-b border-[#1a1c22] px-3 py-3 md:hidden'>
          <button
            onClick={() => setSidebarOpen(true)}
            type='button'
            className='flex h-9 w-9 items-center justify-center rounded-lg text-[#9a9da5] transition hover:bg-white/5 hover:text-white'
          >
            <Menu size={20} />
          </button>
          <h1 className='text-base font-semibold tracking-tight text-white'>
            {chats[currentchatId]?.title?.replace(/\*\*/g, '') || 'Perplexity'}
          </h1>
          <button
            onClick={handleNewChat}
            type='button'
            className='ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#9a9da5] transition hover:bg-white/5 hover:text-white'
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className='flex-1 space-y-4 overflow-y-auto px-3 pb-4 pt-4 md:px-8 md:pt-6'>
          {activeMessages.length === 0 && (
            <div className='flex h-full flex-col items-center justify-center text-center'>
              <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C86FF]/10'>
                <MessageSquare size={22} className='text-[#7C86FF]' />
              </div>
              <p className='text-sm text-[#63666f]'>
                {currentchatId ? 'No messages yet' : 'Start a new conversation'}
              </p>
            </div>
          )}

          {activeMessages.map((message, i) => (
            <div
              key={message.id || i}
              className={`w-fit max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[70%] md:text-base ${
                message.role === 'user'
                  ? 'ml-auto rounded-br-md bg-[#7C86FF]/15 text-white'
                  : 'mr-auto rounded-bl-md border border-[#1a1c22] bg-[#14161c] text-[#d5d6db]'
              }`}
            >
              {message.imageurl && (
                <img src={message.imageurl} alt='attachment' className='mb-2 max-h-64 w-full rounded-xl object-cover' />
              )}

              {message.role === 'user' ? (
                message.content && <p>{message.content}</p>
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className='mb-2 last:mb-0'>{children}</p>,
                    ul: ({ children }) => <ul className='mb-2 list-disc pl-5'>{children}</ul>,
                    ol: ({ children }) => <ol className='mb-2 list-decimal pl-5'>{children}</ol>,
                    code: ({ children }) => <code className='rounded bg-white/10 px-1 py-0.5'>{children}</code>,
                    pre: ({ children }) => <pre className='mb-2 overflow-x-auto rounded-xl bg-black/30 p-3'>{children}</pre>,
                  }}
                  remarkPlugins={[remarkGfm]}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          ))}

          {isLoading && (
            <div className='mr-auto flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#1a1c22] bg-[#14161c] px-4 py-3'>
              <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#7C86FF] [animation-delay:-0.3s]' />
              <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#7C86FF] [animation-delay:-0.15s]' />
              <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#7C86FF]' />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Plain, borderless input */}
        <div className='px-3 pb-4 pt-2 md:px-8 md:pb-6'>
          <div className='mx-auto w-full max-w-3xl'>
            {imagePreviewUrl && (
              <div className='relative mb-2 overflow-hidden rounded-2xl'>
                <img src={imagePreviewUrl} alt='selected preview' className='max-h-56 w-full object-cover' />
                <button
                  type='button'
                  onClick={removeSelectedImage}
                  className='absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/90'
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* NEW: PDF badge (no visual preview, just filename + status) */}
            {selectedPdf && (
              <div className='mb-2 flex items-center gap-2 rounded-2xl border border-[#1a1c22] bg-[#14161c] px-3 py-2'>
                {pdfUploading ? (
                  <Loader2 size={16} className='shrink-0 animate-spin text-[#7C86FF]' />
                ) : (
                  <FileText size={16} className='shrink-0 text-[#7C86FF]' />
                )}
                <span className='truncate text-sm text-[#d5d6db]'>
                  {selectedPdf.name}
                </span>
                <span className='shrink-0 text-xs text-[#5c5f68]'>
                  {pdfUploading ? 'Processing…' : 'Ready'}
                </span>
                <button
                  type='button'
                  onClick={removeSelectedPdf}
                  className='ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#8b8e98] transition hover:bg-white/5 hover:text-white'
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmitMessage}
              className='flex items-end gap-2 rounded-3xl bg-[#14161c] px-3 py-2 shadow-lg shadow-black/30 transition focus-within:shadow-black/50'
            >
              <input type='file' accept='image/*' ref={fileInputRef} onChange={handleFileSelect} className='hidden' />
              <input type='file' accept='application/pdf' ref={pdfInputRef} onChange={handlePdfSelect} className='hidden' /> {/* NEW */}

              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8b8e98] transition hover:bg-white/5 hover:text-white'
                title='Attach image'
              >
                <Paperclip size={18} />
              </button>

              {/* NEW: PDF attach button */}
              <button
                type='button'
                onClick={() => pdfInputRef.current?.click()}
                disabled={pdfUploading}
                className='mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8b8e98] transition hover:bg-white/5 hover:text-white disabled:opacity-50'
                title='Attach PDF'
              >
                <FileText size={18} />
              </button>

              <textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Message Perplexity...'
                rows={1}
                className='max-h-[200px] w-full resize-none bg-transparent py-2 text-base text-white outline-none placeholder:text-[#5c5f68]'
              />

              <button
                type='submit'
                disabled={!chatInput.trim() && !selectedImage}
                className='mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7C86FF] text-white transition hover:bg-[#8b93ff] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#5c5f68]'
              >
                <ArrowUp size={17} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard