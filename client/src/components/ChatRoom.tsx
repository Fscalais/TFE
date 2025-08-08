import React from "react";

type ChatRoomProps = {
  discordInvite?: string | null;
  onLeave: () => void;
};

export default function ChatRoom({ discordInvite, onLeave }: ChatRoomProps) {
  return (
    <div className="border rounded p-4 max-w-md mx-auto mt-6 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Chat du match</h3>
        <button
          onClick={onLeave}
          className="text-sm text-red-600 hover:underline"
          title="Quitter"
        >
          Quitter
        </button>
      </div>

      {discordInvite && (
        <p className="text-indigo-600 font-semibold">
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
    </div>
  );
}
