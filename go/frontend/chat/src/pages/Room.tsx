import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { useParams } from '@solidjs/router';

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  time: string;
  roomId: string;
}

interface SSEEvent {
  type: 'message' | 'presence' | 'typing';
  data: any;
}

const Room: Component = () => {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [message, setMessage] = createSignal('');
  const [user] = createSignal(`user-${Math.floor(Math.random() * 100000)}`);
  const [presence, setPresence] = createSignal(0);
  const [typingUsers, setTypingUsers] = createSignal<Set<string>>(new Set());
  const [loadingHistory, setLoadingHistory] = createSignal(false);
  const [hasMoreHistory, setHasMoreHistory] = createSignal(true);

  let messagesEnd!: HTMLDivElement;
  let messagesContainer!: HTMLDivElement;
  let inputRef!: HTMLInputElement;
  let sentinelRef!: HTMLDivElement;
  let typingTimeout: ReturnType<typeof setTimeout> | null = null;
  let isTyping = false;

  const isOwnMessage = (msg: ChatMessage) => msg.user === user();

  // Load history
  const loadHistory = async () => {
    if (loadingHistory() || !hasMoreHistory()) return;
    setLoadingHistory(true);

    const oldest = messages()[0];
    const before = oldest ? oldest.id : 0;
    const res = await fetch(`/api/v1/room/${params.id}/messages?before=${before}&limit=50`);
    const history: ChatMessage[] = await res.json();

    if (history.length === 0) {
      setHasMoreHistory(false);
    } else {
      const prevHeight = messagesContainer.scrollHeight;
      setMessages((prev) => [...history, ...prev]);
      requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight - prevHeight;
      });
    }
    setLoadingHistory(false);
  };

  // Scroll sentinel
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadHistory();
      },
      { root: messagesContainer, threshold: 0.1 }
    );
    observer.observe(sentinelRef);
    onCleanup(() => observer.disconnect());
  });

  // SSE
  onMount(() => {
    const source = new EventSource(`/api/v1/stream/${params.id}`);

    source.addEventListener('message', (e) => {
      try {
        const evt: SSEEvent = JSON.parse(e.data);
        switch (evt.type) {
          case 'message': {
            const msg = evt.data as ChatMessage;
            setMessages((prev) => [...prev, msg]);
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(msg.user);
              return next;
            });
            messagesEnd?.scrollIntoView({ behavior: 'smooth' });
            break;
          }
          case 'presence':
            setPresence(evt.data.count);
            break;
          case 'typing': {
            const { user: u, active } = evt.data;
            if (u === user()) break;
            setTypingUsers((prev) => {
              const next = new Set(prev);
              if (active) next.add(u);
              else next.delete(u);
              return next;
            });
            break;
          }
        }
      } catch {
        setMessages((prev) => [...prev, { id: 0, user: '', text: e.data, time: '', roomId: '' }]);
      }
    });

    source.onerror = () => console.error('SSE connection error');
    onCleanup(() => source.close());
    inputRef?.focus();
  });

  // Typing indicator
  const sendTyping = (active: boolean) => {
    fetch(`/api/v1/room/${params.id}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: user(), active }),
    });
  };

  const handleInput = (text: string) => {
    setMessage(text);
    if (!isTyping && text.length > 0) {
      isTyping = true;
      sendTyping(true);
    }
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      if (isTyping) {
        isTyping = false;
        sendTyping(false);
      }
    }, 2000);
  };

  const sendMessage = async (e: SubmitEvent) => {
    e.preventDefault();
    const text = message().trim();
    if (!text) return;

    if (isTyping) {
      isTyping = false;
      sendTyping(false);
    }

    const body = new URLSearchParams({ user: user(), message: text });
    await fetch(`/api/v1/room/${params.id}`, { method: 'POST', body });
    setMessage('');
    inputRef?.focus();
  };

  const typingText = () => {
    const users = [...typingUsers()].filter((u) => u !== user());
    if (users.length === 0) return '';
    if (users.length === 1) return users[0];
    if (users.length === 2) return `${users[0]} and ${users[1]}`;
    return `${users.length} people`;
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div class="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div class="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow">
        <a href="/rooms" class="text-white/80 hover:text-white text-sm">&larr; Back</a>
        <div class="text-center">
          <h1 class="font-semibold text-lg">{params.id}</h1>
          <p class="text-xs text-green-100">{presence()} online</p>
        </div>
        <div class="w-12" />
      </div>

      {/* Messages */}
      <div ref={messagesContainer} class="flex-1 overflow-y-auto px-4 py-3">
        <div ref={sentinelRef} class="h-1" />
        <Show when={loadingHistory()}>
          <p class="text-center text-gray-400 text-xs py-2">Loading...</p>
        </Show>
        <Show when={!hasMoreHistory()}>
          <p class="text-center text-gray-400 text-xs py-2">Beginning of conversation</p>
        </Show>

        <For each={messages()}>
          {(msg) => (
            <div class={`flex mb-2 ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
              <div class={`max-w-[75%] ${isOwnMessage(msg) ? 'order-2' : ''}`}>
                <Show when={!isOwnMessage(msg)}>
                  <p class="text-xs text-gray-500 mb-0.5 ml-3">{msg.user}</p>
                </Show>
                <div
                  class={`px-3 py-2 rounded-2xl shadow-sm ${
                    isOwnMessage(msg)
                      ? 'bg-green-500 text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md'
                  }`}
                >
                  <p class="text-sm leading-relaxed">{msg.text}</p>
                </div>
                <p class={`text-[10px] text-gray-400 mt-0.5 ${isOwnMessage(msg) ? 'text-right mr-2' : 'ml-3'}`}>
                  {formatTime(msg.time)}
                </p>
              </div>
            </div>
          )}
        </For>

        {/* Typing indicator bubble */}
        <Show when={typingText()}>
          <div class="flex justify-start mb-2">
            <div class="max-w-[75%]">
              <p class="text-xs text-gray-500 mb-0.5 ml-3">{typingText()}</p>
              <div class="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm inline-flex gap-1 items-center">
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </Show>

        <div ref={messagesEnd} />
      </div>

      {/* Input bar */}
      <div class="bg-white border-t px-4 py-2 safe-bottom">
        <form onSubmit={sendMessage} class="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message()}
            onInput={(e) => handleInput(e.currentTarget.value)}
            placeholder="Message..."
            class="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            class="bg-green-500 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Room;
