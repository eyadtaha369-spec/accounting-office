"use client";
import SyncBar from "./SyncBar";
import { useAdmin, useClient } from "./stores";

export function AdminSync() {
  return <SyncBar s={useAdmin()} />;
}
export function ClientSync() {
  return <SyncBar s={useClient()} />;
}
