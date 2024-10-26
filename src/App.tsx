import mqtt from "mqtt";
import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
} from "solid-js";

const GridSize = 100;
const canvasWidth = 2000;
const canvasHeight = 2000;
const emojis = ["😎", "🔥", "💧", "🌿", "⭐", "💀"];

export default function EmojiBattle() {
  let canvas!: HTMLCanvasElement;
  const [canvasSize, setCanvasSize] = createSignal({
    width: canvasWidth,
    height: canvasHeight,
  });

  const [zoom, setZoom] = createSignal(1);
  const [selectedEmoji, setSelectedEmoji] = createSignal<string>("😎");

  const client = mqtt.connect("ws://192.168.204.109:8083/mqtt");

  const drawGrid = () => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridPixelSize = canvasSize().width / GridSize;

    // Draw the grid lines
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridPixelSize, 0);
      ctx.lineTo(i * gridPixelSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * gridPixelSize);
      ctx.lineTo(canvas.width, i * gridPixelSize);
      ctx.stroke();
    }
  };

  const drawEmoji = (x: number, y: number, emoji: string) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridPixelSize = canvasSize().width / GridSize;
    ctx.clearRect(
      x * gridPixelSize,
      y * gridPixelSize,
      gridPixelSize,
      gridPixelSize
    );
    ctx.font = `${gridPixelSize * 0.8}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      emoji,
      x * gridPixelSize + gridPixelSize / 2,
      y * gridPixelSize + gridPixelSize / 2
    );
  };

  const handleCanvasClick = (event: MouseEvent | TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x = 0,
      y = 0;
    if ("clientX" in event && "clientY" in event) {
      x = (event.clientX - rect.left) * scaleX;
      y = (event.clientY - rect.top) * scaleY;
    } else if ("touches" in event && event.touches.length > 0) {
      x = (event.touches[0].clientX - rect.left) * scaleX;
      y = (event.touches[0].clientY - rect.top) * scaleY;
    }

    const gridPixelSize = canvasSize().width / GridSize;
    const gridX = Math.floor(x / gridPixelSize);
    const gridY = Math.floor(y / gridPixelSize);

    if (gridX >= 0 && gridX < GridSize && gridY >= 0 && gridY < GridSize) {
      updateEmoji(gridX, gridY);
    }
  };

  const handleCellUpdate = (topic: string, message: string) => {
    const [, , rowIndexStr, colIndexStr] = topic.split("/");
    const rowIndex = Number.parseInt(rowIndexStr, 10);
    const colIndex = Number.parseInt(colIndexStr, 10);
    const { emoji } = JSON.parse(message);

    if (!Number.isNaN(rowIndex) && !Number.isNaN(colIndex)) {
      drawEmoji(rowIndex, colIndex, emoji);
    }
  };

  const publishGridUpdate = (
    rowIndex: number,
    colIndex: number,
    emoji: string
  ) => {
    const topic = `emojiBattle/gridUpdate/${rowIndex}/${colIndex}`;
    const message = JSON.stringify({ emoji });
    client.publish(topic, message, { retain: true, qos: 0 });
  };

  const updateEmoji = (rowIndex: number, colIndex: number) => {
    const newEmoji = selectedEmoji();
    publishGridUpdate(rowIndex, colIndex, newEmoji);
  };

  onMount(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    drawGrid(); // Draw the grid initially

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    if (isMobile) {
      canvas.addEventListener("touchmove", handleCanvasClick);
    } else {
      canvas.addEventListener("mousemove", handleCanvasClick);
    }

    client.on("connect", () => {
      client.subscribe("emojiBattle/gridUpdate/#");

      client.on("message", (topic, message) => {
        if (topic.startsWith("emojiBattle/gridUpdate/")) {
          handleCellUpdate(topic, message.toString());
        }
      });
    });
  });

  onCleanup(() => {
    canvas.removeEventListener("click", handleCanvasClick);
    client.end();
  });

  return (
    <div style="display: flex; flex-direction: column; align-items: center; padding: 20px; background-color: #f0f0f5;">
      <h2 style="color: #333; font-size: 1.8em; margin-bottom: 10px;">
        Real-Time Emoji Battle
      </h2>

      <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px;">
        <For each={emojis}>
          {(emoji) => (
            <button
              type="button"
              style={`width: 40px; height: 40px; font-size: 1.5em; border: ${
                selectedEmoji() === emoji ? "3px solid #444" : "2px solid #ccc"
              };`}
              onClick={() => setSelectedEmoji(emoji)}
            >
              {emoji}
            </button>
          )}
        </For>
      </div>

      <canvas
        ref={canvas}
        width={canvasSize().width}
        height={canvasSize().height}
        style="border: 1px solid #ddd; background-color: #f9f9f9; cursor: crosshair;"
      />
    </div>
  );
}
