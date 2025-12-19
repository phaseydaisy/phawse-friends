(function () {
	const REFRESH_INTERVAL = 5 * 60 * 1000;
	const apiBase = (document.body && document.body.dataset && document.body.dataset.avatarApi) || '';

	function cacheBustAndSwap(img) {
		if (!img.dataset.originalSrc) img.dataset.originalSrc = img.src.split('?')[0];
		const original = img.dataset.originalSrc;
		const cbUrl = original + (original.includes('?') ? '&' : '?') + '_=' + Date.now();
		const p = new Image();
		p.onload = () => { img.src = cbUrl; };
		p.onerror = () => { /* ignore */ };
		p.src = cbUrl;
	}

	async function fetchAvatarUrlFromApi(id, size = 1024) {
		if (!apiBase) return null;
		try {
			// ivr.fi public user info API
			if (apiBase === 'ivr' || apiBase.includes('ivr.fi')) {
				const res = await fetch(`https://api.ivr.fi/v2/user/${encodeURIComponent(id)}`);
				if (!res.ok) return null;
				const data = await res.json();
				if (data && data.avatar) {
					const isGif = data.avatar.startsWith('a_');
					const ext = isGif ? 'gif' : 'webp';
					return `https://cdn.discordapp.com/avatars/${id}/${data.avatar}.${ext}?size=${size}`;
				}
				// default avatar
				const idx = (parseInt(data.discriminator || '0') % 5);
				return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
			}

			// generic API: expect { "url": "..." }
			const url = apiBase.replace(/\/$/, '') + '/' + encodeURIComponent(id) + '?size=' + encodeURIComponent(size);
			const res = await fetch(url);
			if (!res.ok) return null;
			const data = await res.json();
			return data && data.url ? data.url : null;
		} catch (e) {
			return null;
		}
	}

	async function updateImg(img) {
		const id = img.dataset.discordId;
		if (!id) return;
		// prefer API if configured; otherwise cache-bust
		if (apiBase) {
			const url = await fetchAvatarUrlFromApi(id, img.dataset.size || 1024);
			if (url) { if (img.src !== url) img.src = url; return; }
			// fall through to cache-bust if API fails
		}
		cacheBustAndSwap(img);
	}

	function start() {
		const imgs = Array.from(document.querySelectorAll('img[data-discord-id]'));
		if (!imgs.length) return;
		imgs.forEach(updateImg);
		setInterval(() => imgs.forEach(updateImg), REFRESH_INTERVAL);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}
})();
