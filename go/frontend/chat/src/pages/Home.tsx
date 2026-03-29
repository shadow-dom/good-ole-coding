import type { Component } from 'solid-js';

const Home: Component = () => {
  return (
    <div class="p-8">
      <h1 class="text-4xl font-bold text-green-700">Chat App</h1>
      <p class="mt-4 text-lg text-gray-600">Welcome to the chat application.</p>
      <a href="/rooms" class="mt-4 inline-block text-blue-600 underline">
        View Rooms
      </a>
    </div>
  );
};

export default Home;
