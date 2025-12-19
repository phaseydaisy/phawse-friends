// Automatic avatar updating and API calls removed.
// Use from the console: setAvatar('DISCORD_ID', 'https://.../avatar.png')
(function () {
	'use strict';

	// Entrance animation: auto-add body.entrance-done after brief reveal, allow click-to-skip
	function runEntrance() {
		const overlay = document.querySelector('.enter-overlay');
		if (!overlay) {
			document.body.classList.add('entrance-done');
			return;
		}
		// show overlay briefly, then mark as done (this triggers CSS fade-out)
		const SHOW_MS = 900;
		let timeout = setTimeout(() => document.body.classList.add('entrance-done'), SHOW_MS);

		// allow skipping early by clicking/tapping
		const skip = () => {
			clearTimeout(timeout);
			document.body.classList.add('entrance-done');
		};
		overlay.addEventListener('click', skip, { once: true, passive: true });

		// remove overlay element after fade completes (safe cleanup)
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

	// Manual avatar helpers (unchanged)
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
