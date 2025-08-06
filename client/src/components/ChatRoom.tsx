import React, { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";

type ChatRoomProps = {
  socket: Socket;
  roomId: string;
  userId: string;
  discordInvite?: string | null; // lien Discord optionnel
  onLeave: () => void;
};

type Message = {
  userId: string;
  message: string;
  timestamp: number;
};

export default function ChatRoom({
  socket,
  roomId,
  userId,
  discordInvite,
  onLeave,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Écoute des messages entrants
    socket.on("chatMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Nettoyage à la sortie
    return () => {
      socket.off("chatMessage");
    };
  }, [socket]);

  useEffect(() => {
    // Scroll vers le bas à chaque nouveau message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === "") return;
    socket.emit("chatMessage", { roomId, userId, message: input.trim() });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="border rounded p-4 max-w-md mx-auto mt-6 flex flex-col h-96">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Chat du match</h3>
        <button
          onClick={onLeave}
          className="text-sm text-red-600 hover:underline"
          title="Quitter le chat"
        >
          Quitter
        </button>
      </div>

      {/* Lien Discord affiché ici */}
      {discordInvite && (
        <p className="mb-2 text-indigo-600 font-semibold">
          <a
            href={discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Rejoindre le salon Discord dédié au match
          </a>
        </p>
      )}

      <div className="flex-1 overflow-y-auto border rounded p-2 mb-2 bg-white">
        {messages.length === 0 && (
          <p className="text-gray-500">Aucun message pour le moment...</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-1 px-2 py-1 rounded ${
              msg.userId === userId ? "bg-indigo-100 self-end" : "bg-gray-100 self-start"
            } max-w-[80%]`}
          >
            <div className="text-xs text-gray-600">
              {msg.userId === userId ? "Moi" : `Joueur ${msg.userId}`} -{" "}
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
            <div>{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex">
        <input
          type="text"
          className="flex-grow border rounded-l px-3 py-2 focus:outline-none"
          placeholder="Écrire un message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white px-4 rounded-r hover:bg-indigo-700 transition"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
