(function () {
	'use strict';

	function runEntrance() {
		const overlay = document.querySelector('.enter-overlay');
		if (!overlay) {
			document.body.classList.add('entrance-done');
			return;
		}
		const SHOW_MS = 900;
		let timeout = setTimeout(() => document.body.classList.add('entrance-done'), SHOW_MS);
		const skip = () => {
			clearTimeout(timeout);
			document.body.classList.add('entrance-done');
		};
		overlay.addEventListener('click', skip, { once: true, passive: true });
		const CLEANUP_MS = SHOW_MS + 800;
		setTimeout(() => {
			if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
		}, CLEANUP_MS);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', runEntrance);
	} else {
		runEntrance();
	}
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

	window.setAvatar = setAvatar;
	window.resetAvatar = resetAvatar;
})();
