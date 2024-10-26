// Import necessary libraries
import { useParams } from "@solidjs/router";
import { createSignal, onMount, onCleanup } from "solid-js";
import mqtt from "mqtt";

export default function EmojiSelectionPage() {
  const { code } = useParams(); // Retrieve code from the URL
  const [selectedEmoji, setSelectedEmoji] = createSignal<string | null>(null);
  const client = mqtt.connect("ws://192.168.204.109/mqtt"); // Replace with your broker URL

  // Load the selected emoji from localStorage if it exists
  onMount(() => {
    const savedEmoji = localStorage.getItem(`emojiSelection-${code}`);
    if (savedEmoji) {
      setSelectedEmoji(savedEmoji);
    }

    client.on("connect", () => {
      console.log(`Connected to MQTT broker for room ${code}`);
      client.publish(`/room/${code}`, "", { retain: true });
    });

    onCleanup(() => {
      client.end();
    });
  });

  // Function to select an emoji, persist it in localStorage, and publish it to MQTT
  const handleSelectEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
    localStorage.setItem(`emojiSelection-${code}`, emoji);

    // Publish the selected emoji to the room's MQTT topic
    client.publish(`/room/${code}`, JSON.stringify({ emoji }));
    console.log(`Published ${emoji} to /room/${code}`);
  };

  return (
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">
        Select Your Element for Code: {code}
      </h1>
      <div class="flex space-x-4 mb-4">
        <button
          onClick={() => handleSelectEmoji("🔥")}
          class={`text-3xl ${
            selectedEmoji() === "🔥" ? "bg-red-300" : "bg-white"
          } px-4 py-2 rounded-full hover:bg-red-100 focus:outline-none`}
        >
          🔥
        </button>
        <button
          onClick={() => handleSelectEmoji("💧")}
          class={`text-3xl ${
            selectedEmoji() === "💧" ? "bg-blue-300" : "bg-white"
          } px-4 py-2 rounded-full hover:bg-blue-100 focus:outline-none`}
        >
          💧
        </button>
      </div>
      {selectedEmoji() && (
        <p class="text-lg text-gray-700">
          You selected: <span class="text-3xl">{selectedEmoji()}</span>
        </p>
      )}
    </div>
  );
}
