/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

import { immutable, assets, prerendered } from '$app/manifest';
import { version } from '$app/env';

// Create unique cache key for current build version
const CACHE = `absenpak-v${version}`;

// Assets to precache (Vite immutable bundles, static assets, prerendered pages)
const ASSETS = [
	...immutable,
	...assets,
	...prerendered
];

self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) {
				await caches.delete(key);
			}
		}
	}

	event.waitUntil(deleteOldCaches());
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	// Only handle GET requests; pass POST/PUT/DELETE forms directly to network
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// Static assets: serve cache-first
		if (ASSETS.includes(url.pathname)) {
			const cachedResponse = await cache.match(url.pathname);
			if (cachedResponse) {
				return cachedResponse;
			}
		}

		// Dynamic HTML pages: try network first so attendance/auth is always fresh
		try {
			const response = await fetch(event.request);

			if (response instanceof Response && response.status === 200 && url.protocol.startsWith('http')) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const cachedResponse = await cache.match(event.request);
			if (cachedResponse) {
				return cachedResponse;
			}

			throw err;
		}
	}

	event.respondWith(respond());
});
