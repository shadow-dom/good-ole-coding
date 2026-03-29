import { Component, createResource, For } from 'solid-js';

const fetchRooms = async () => {
  const res = await fetch('/api/v1/room');
  return res.json();
};

const Rooms: Component = () => {
  const [rooms] = createResource(fetchRooms);

  return (
    <div class="p-8">
      <h1 class="text-4xl font-bold text-green-700">Rooms</h1>
      <a href="/" class="text-blue-600 underline">Back to Home</a>

      <div class="mt-6">
        {rooms.loading && <p>Loading rooms...</p>}
        {rooms.error && <p class="text-red-500">Failed to load rooms.</p>}
        {rooms() && (
          <ul class="space-y-2">
            <For each={rooms()}>
              {(room: any) => (
                <li class="p-3 border rounded">{room.name ?? JSON.stringify(room)}</li>
              )}
            </For>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Rooms;
