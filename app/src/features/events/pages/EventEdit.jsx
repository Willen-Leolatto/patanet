// src/features/events/pages/EventEdit.jsx
import React from "react";
import EventCreate from "./EventCreate";

// Reutiliza o mesmo formulário de criação, agora com eventId via rota
export default function EventEdit() {
  return <EventCreate />;
}
