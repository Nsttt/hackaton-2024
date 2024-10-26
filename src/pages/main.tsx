// Import necessary libraries
import { useNavigate } from "@solidjs/router";
import { createSignal, onCleanup, onMount, For } from "solid-js";
import mqtt from "mqtt";

export default function CodePage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = createSignal({});

  // Initialize MQTT client
  const client = mqtt.connect("ws://192.168.204.109:8083/mqtt");
  // Function to generate a short alphabetic code
  const generateCode = (): string => {
    const part1 = ("000" + ((Math.random() * 1296) | 0).toString(36)).slice(-3);
    const part2 = ("000" + ((Math.random() * 1296) | 0).toString(36)).slice(-3);
    return `${part1}${part2}`;
  };

  // Generate and navigate to a new code
  const handleGenerateCode = () => {
    const newCode = generateCode();
    navigate(`/${newCode}`);
  };

  // Prompt to join an existing code
  const handleJoinCode = () => {
    const existingCode = prompt("Enter the code to join:");
    if (existingCode) {
      navigate(`/${existingCode}`);
    }
  };

  // Subscribe to room and player topics
  onMount(() => {
    client.on("connect", () => {
      // Subscribe to the list of available rooms
      client.subscribe("/rooms");
    });

    client.on("message", (topic, message) => {
      console.log(topic, message);
      if (topic === "/rooms") {
        // Parse room list and initialize player counts
        const availableRooms = JSON.parse(message.toString());
        const roomUpdates = {};
        availableRooms.forEach((roomId) => {
          roomUpdates[roomId] = { players: 0, maxPlayers: 4 };
          client.subscribe(`/room/${roomId}/#`);
        });
        setRooms(roomUpdates);
      } else if (topic.startsWith("/room/")) {
        // Update player count in a specific room
        const roomId = topic.split("/")[2];
        setRooms((prev) => {
          const newRooms = { ...prev };
          if (!newRooms[roomId]) {
            newRooms[roomId] = { players: 0, maxPlayers: 4 };
          }
          newRooms[roomId].players = Math.min(newRooms[roomId].players + 1, 4);
          return newRooms;
        });
      }
    });

    onCleanup(() => {
      client.end();
    });
  });

  return (
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 class="text-2xl font-bold mb-6 text-gray-800">Available Rooms</h1>
      <div class="mb-4">
        <For each={Object.entries(rooms())}>
          {([roomId, { players, maxPlayers }]) => (
            <div class="mb-2">
              Room: <strong>{roomId}</strong> - Players: {players}/{maxPlayers}
            </div>
          )}
        </For>
      </div>
      <div class="flex space-x-4">
        <button
          onClick={handleGenerateCode}
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
        >
          Generate Code
        </button>
        <button
          onClick={handleJoinCode}
          class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
        >
          Join Existing Code
        </button>
      </div>
    </div>
  );
}
