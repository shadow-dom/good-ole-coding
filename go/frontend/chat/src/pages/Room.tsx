import { Component, createSignal, onMount, onCleanup, For } from 'solid-js';
import { useParams } from '@solidjs/router';

const Room: Component = () => {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = createSignal<string[]>([]);
  const [message, setMessage] = createSignal('');
  const [user] = createSignal(`user-${Math.floor(Math.random() * 100000)}`);
  let messagesEnd!: HTMLDivElement;
  let inputRef!: HTMLInputElement;

  onMount(() => {
    const source = new EventSource(`/api/v1/stream/${params.id}`);

    source.addEventListener('message', (e) => {
      setMessages((prev) => [...prev, e.data]);
      messagesEnd?.scrollIntoView({ behavior: 'smooth' });
    });

    source.onerror = () => {
      console.error('SSE connection error');
    };

    onCleanup(() => source.close());
    inputRef?.focus();
  });

  const sendMessage = async (e: SubmitEvent) => {
    e.preventDefault();
    const text = message().trim();
    if (!text) return;

    const body = new URLSearchParams({ user: user(), message: text });
    await fetch(`/api/v1/room/${params.id}`, {
      method: 'POST',
      body,
    });

    setMessage('');
    inputRef?.focus();
  };

  return (
    <div class="flex flex-col h-screen p-4">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold text-green-700">Room: {params.id}</h1>
        <a href="/rooms" class="text-blue-600 underline text-sm">Back to Rooms</a>
      </div>

      <div class="flex-1 overflow-y-auto border rounded p-4 mb-4 bg-gray-50">
        <For each={messages()}>
          {(msg) => <p class="py-1">{msg}</p>}
        </For>
        <div ref={messagesEnd} />
      </div>

      <form onSubmit={sendMessage} class="flex gap-2">
        <span class="self-center text-sm text-gray-500">{user()}</span>
        <input
          ref={inputRef}
          type="text"
          value={message()}
          onInput={(e) => setMessage(e.currentTarget.value)}
          placeholder="Type a message..."
          class="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Room;
