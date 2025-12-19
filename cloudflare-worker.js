export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		// Support /avatar/:id or /avatar?id=...
		let id = null;
		if (url.pathname.startsWith('/avatar/')) id = url.pathname.split('/').pop();
		if (!id) id = url.searchParams.get('id');
		const size = url.searchParams.get('size') || '1024';

		if (!id) return new Response(JSON.stringify({ error: 'missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
		if (!env.DISCORD_BOT_TOKEN) return new Response(JSON.stringify({ error: 'missing token' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

		const discordRes = await fetch(`https://discord.com/api/v10/users/${encodeURIComponent(id)}`, {
			headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` }
		});

		if (!discordRes.ok) {
			const text = await discordRes.text().catch(() => '');
			return new Response(JSON.stringify({ error: 'discord error', detail: text }), { status: discordRes.status, headers: { 'Content-Type': 'application/json' } });
		}

		const user = await discordRes.json();
		let avatarUrl;
		if (user.avatar) {
			const isGif = user.avatar.startsWith('a_');
			const ext = isGif ? 'gif' : 'webp';
			avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.${ext}?size=${size}`;
		} else {
			const defaultIndex = (parseInt(user.discriminator || '0') % 5);
			avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
		}

		return new Response(JSON.stringify({ url: avatarUrl }), { headers: { 'Content-Type': 'application/json' } });
	}
};
