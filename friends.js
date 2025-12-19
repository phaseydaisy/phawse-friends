(function () {
	'use strict';

	function setAvatar(id, url) {
		if (!id || !url) return;
		const img = document.querySelector(`img[data-discord-id="${id}"]`);
		if (!img) return;
		if (!img.dataset.originalSrc) img.dataset.originalSrc = img.src;
		img.src = url;
	}

	function resetAvatar(id) {
		if (!id) return;
		const img = document.querySelector(`img[data-discord-id="${id}"]`);
		if (!img || !img.dataset.originalSrc) return;
		img.src = img.dataset.originalSrc;
	}

	// create a styled fallback showing initials and replace the broken image
	function createAvatarFallback(img) {
		try {
			const card = img.closest('.friend-card');
			const nameEl = card ? card.querySelector('.friend-name') : null;
			const name = (nameEl && nameEl.textContent) ? nameEl.textContent.trim() : '';
			const initials = (name ? name.split(/\s+/).map(p => p[0]).slice(0,2).join('') : '?').toUpperCase();

			const span = document.createElement('span');
			span.className = 'avatar-fallback';
			span.textContent = initials;
			// replace img with fallback while keeping the same wrapper (.friend-avatar)
			const wrap = img.parentNode;
			if (wrap) {
				// remove img (prevent broken icon)
				if (img.parentNode) img.parentNode.removeChild(img);
				wrap.appendChild(span);
			}
		} catch (err) {
			// silent
		}
	}

	// attach handlers to existing images
	function attachAvatarFallbacks() {
		const imgs = Array.from(document.querySelectorAll('.friend-avatar img'));
		imgs.forEach(img => {
			// if image already failed / zero naturalWidth, create fallback immediately
			if (img.complete && img.naturalWidth === 0) {
				createAvatarFallback(img);
				return;
			}
			// handle future error events
			img.addEventListener('error', () => createAvatarFallback(img), { once: true });
			// defensive: if image loads successfully ensure it's visible
			img.addEventListener('load', () => {
				// ensure parent wrapper doesn't already have a fallback
				const wrap = img.parentNode;
				if (!wrap) return;
				const existingFallback = wrap.querySelector('.avatar-fallback');
				if (existingFallback) existingFallback.remove();
			});
		});
	}

	// init on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			attachAvatarFallbacks();
		});
	} else {
		attachAvatarFallbacks();
	}

	window.setAvatar = setAvatar;
	window.resetAvatar = resetAvatar;
})();
