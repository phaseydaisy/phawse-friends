(function () {
	'use strict';

	function runEntrance() {
		const KEY = 'phawse:entrance-start';
		const TOTAL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--phawse-entrance-total') || '1500', 10);
		const now = Date.now();
		const stored = parseInt(localStorage.getItem(KEY), 10);
		if (!stored || isNaN(stored)) {
			localStorage.setItem(KEY, String(now));
			setTimeout(() => document.body.classList.add('entrance-done'), TOTAL);
			return;
		}
		const elapsed = now - stored;
		if (elapsed >= TOTAL) {
			document.body.classList.add('entrance-done');
		} else {
			setTimeout(() => document.body.classList.add('entrance-done'), TOTAL - elapsed);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			runEntrance();
			attachAvatarListeners && attachAvatarListeners();
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

	let openBox = null;
	let openCard = null;
	let outsideClickHandler = null;
	let escHandler = null;

	function escapeHtml(s) {
		return (s || '').replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	function renderNotesText(text) {
		if (!text) return '';
		return text.split(/\r?\n/).map(line => `<p>${escapeHtml(line)}</p>`).join('');
	}

	function getNotesFromCard(card) {
		const src = card.querySelector('.friend-notes-source');
		if (src && src.textContent.trim()) return src.textContent.trim();
		return card.dataset.notes || '';
	}

	function createNoteBox(card) {
		const name = (card.querySelector('.friend-name') || {}).textContent || '';
		const notesHtml = renderNotesText(getNotesFromCard(card));
		const box = document.createElement('div');
		box.className = 'friend-note-box';
		box.innerHTML = `
			<div class="friend-note-inner" aria-hidden="false">
				<h4 class="note-header">${escapeHtml(name)}</h4>
				<div class="note-quotes">${notesHtml}</div>
			</div>
		`;
		return box;
	}

	function updateOpenNoteContentFor(card) {
		if (!openCard || openCard !== card || !openBox) return;
		const quotes = openBox.querySelector('.note-quotes');
		if (quotes) quotes.innerHTML = renderNotesText(getNotesFromCard(card));
	}

	window.setNote = function (id, text) {
		if (!id) return;
		const img = document.querySelector(`img[data-discord-id="${id}"]`);
		if (!img) return;
		const card = img.closest('.friend-card');
		if (!card) return;
		const src = card.querySelector('.friend-notes-source');
		if (src) src.textContent = text || '';
		card.dataset.notes = text || '';
		updateOpenNoteContentFor(card);
	};

	window.clearNote = function (id) {
		window.setNote(id, '');
	};

	function openNoteUnder(card) {
		if (openCard && openCard !== card) closeNote();
		const box = createNoteBox(card);
		card.appendChild(box);

		void box.offsetHeight;
		requestAnimationFrame(() => box.classList.add('open'));

		card.classList.add('active');
		card.setAttribute('aria-expanded', 'true');
		openBox = box;
		openCard = card;
		outsideClickHandler = (e) => {
			if (!openCard) return;
			if (!openCard.contains(e.target)) closeNote();
		};
		document.addEventListener('click', outsideClickHandler);
		escHandler = (e) => { if (e.key === 'Escape') closeNote(); };
		document.addEventListener('keydown', escHandler);
	}

	function closeNote() {
		if (!openBox || !openCard) return;
		const box = openBox;
		const card = openCard;
		box.classList.remove('open');
		card.classList.remove('active');
		card.setAttribute('aria-expanded', 'false');
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
