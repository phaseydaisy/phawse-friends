(function () {
	'use strict';

	function runEntrance() {
		const SHOW_MS = 120;
		setTimeout(() => document.body.classList.add('entrance-done'), SHOW_MS);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			runEntrance();
			attachAvatarListeners && attachAvatarListeners(); // re-attach if present
		});
	} else {
		runEntrance();
		attachAvatarListeners && attachAvatarListeners();
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

	// --- New: per-avatar note panels (no layout shift) ---
	let openBox = null;
	let openCard = null;
	let outsideClickHandler = null;
	let escHandler = null;

	function createNoteBox(card) {
		const name = (card.querySelector('.friend-name') || {}).textContent || '';
		const box = document.createElement('div');
		box.className = 'friend-note-box';
		box.innerHTML = `
			<div class="friend-note-inner" aria-hidden="false">
				<h4 class="note-header">${name}</h4>
				<div class="note-quotes"><!-- notes left empty for now --></div>
			</div>
		`;
		return box;
	}

	function openNoteUnder(card) {
		if (openCard && openCard !== card) closeNote();

		// if already open on this card, toggle handled by caller
		const box = createNoteBox(card);
		card.appendChild(box); // append inside card (absolute) so it doesn't move siblings

		// force reflow then add open class to animate
		void box.offsetHeight;
		requestAnimationFrame(() => box.classList.add('open'));

		card.classList.add('active');
		card.setAttribute('aria-expanded', 'true');
		openBox = box;
		openCard = card;

		// close when clicking outside
		outsideClickHandler = (e) => {
			if (!openCard) return;
			if (!openCard.contains(e.target)) closeNote();
		};
		document.addEventListener('click', outsideClickHandler);

		// close on Escape
		escHandler = (e) => { if (e.key === 'Escape') closeNote(); };
		document.addEventListener('keydown', escHandler);
	}

	function closeNote() {
		if (!openBox || !openCard) return;
		const box = openBox;
		const card = openCard;
		// animate out
		box.classList.remove('open');
		card.classList.remove('active');
		card.setAttribute('aria-expanded', 'false');

		// remove element after transition
		const cleanup = (e) => {
			if (!e || e.propertyName === 'opacity') {
				if (box.parentNode) box.parentNode.removeChild(box);
				openBox = null;
				openCard = null;
				document.removeEventListener('click', outsideClickHandler);
				document.removeEventListener('keydown', escHandler);
			}
		};
		box.addEventListener('transitionend', cleanup);
		// fallback cleanup if transitionend doesn't fire
		setTimeout(cleanup, 420);
	}

	function onAvatarClick(e) {
		const avatarWrap = e.currentTarget;
		const card = avatarWrap.closest('.friend-card');
		if (!card) return;
		if (openCard === card) {
			closeNote();
		} else {
			openNoteUnder(card);
			// ensure card is visible on small screens
			if (window.innerWidth < 900) {
				setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 260);
			}
		}
	}

	function attachAvatarListeners() {
		const avatarEls = Array.from(document.querySelectorAll('.friend-card .friend-avatar'));
		avatarEls.forEach(a => {
			a.removeEventListener('click', onAvatarClick);
			a.addEventListener('click', onAvatarClick);
			a.setAttribute('role', 'button');
			a.setAttribute('tabindex', '0');
			a.addEventListener('keydown', (ev) => {
				if (ev.key === 'Enter' || ev.key === ' ') {
					ev.preventDefault();
					onAvatarClick({ currentTarget: a });
				}
			});
		});
	}
})();
