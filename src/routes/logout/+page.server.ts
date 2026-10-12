import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types.js';
import { clearSessionCookie } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ cookies }) => {
		clearSessionCookie(cookies);
		throw redirect(303, '/login');
	}
};
