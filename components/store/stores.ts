"use client";
import { createStore } from "./createStore";
import type { AdminData, ClientData } from "@/lib/store-types";

const AdminStore = createStore<AdminData>();
const ClientStore = createStore<ClientData>();

// تُصدَّر كمكونات مستقلة حتى يمكن استخدامها داخل الـ layouts (Server Components)
export const AdminProvider = AdminStore.Provider;
export const ClientProvider = ClientStore.Provider;
export const useAdmin = AdminStore.useStore;
export const useClient = ClientStore.useStore;
