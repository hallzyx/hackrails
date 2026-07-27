"use client";

import { ParticipantDashboard } from "../../components/participant-dashboard";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function TeamPage() {
  return <ParticipantDashboard api={api} />;
}
