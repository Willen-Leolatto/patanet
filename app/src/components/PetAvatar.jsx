// src/components/PetAvatar.jsx
import React from "react";

export default function PetAvatar({ pet, size = 40, onClick }) {
  const hasPhoto = pet?.photo && typeof pet.photo === "string";
  const initials =
    (pet?.name || "?")
      .split(" ")
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?";

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-center rounded-full ring-2 ring-white/15 hover:ring-white/30 transition"
      style={{ width: size, height: size }}
      title={pet?.name || "Pet"}
    >
      {hasPhoto ? (
        <img
          src={pet.photo}
          alt={pet?.name || "pet"}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="h-full w-full rounded-full bg-white/15 text-[var(--chrome-fg)] grid place-items-center text-xs font-semibold">
          {initials}
        </div>
      )}
    </button>
  );
}
