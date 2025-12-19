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

	function openNoteUnder(card) {
		if (openCard && openCard !== card) closeNote();

		// create panel and insert after the card (flow, pushes content down)
		const box = createNoteBox(card);
		card.parentNode.insertBefore(box, card.nextSibling);

		// start collapsed
		box.style.maxHeight = '0px';
		box.style.opacity = '0';
		// force reflow
		void box.offsetHeight;

		// measure content and expand
		const inner = box.querySelector('.friend-note-inner');
		const target = inner ? inner.scrollHeight + 8 : 120;
		box.style.transition = 'max-height 320ms ease, opacity 220ms ease';
		requestAnimationFrame(() => {
			box.style.maxHeight = target + 'px';
			box.style.opacity = '1';
			box.classList.add('open');
		});

		// after open transition completes, remove max-height so content can size naturally
		const onOpenEnd = (e) => {
			if (e.propertyName === 'max-height') {
				box.style.maxHeight = 'none';
				box.removeEventListener('transitionend', onOpenEnd);
			}
		};
		box.addEventListener('transitionend', onOpenEnd);

		card.classList.add('active');
		card.setAttribute('aria-expanded', 'true');
		openBox = box;
		openCard = card;

		outsideClickHandler = (e) => {
			if (!openCard) return;
			if (!openCard.contains(e.target) && !openBox.contains(e.target)) closeNote();
		};
		document.addEventListener('click', outsideClickHandler);

		escHandler = (e) => { if (e.key === 'Escape') closeNote(); };
		document.addEventListener('keydown', escHandler);
	}

	function closeNote() {
		if (!openBox || !openCard) return;
		const box = openBox;
		const card = openCard;

		// set a fixed height to animate from current size to 0
		const current = box.getBoundingClientRect().height;
		box.style.maxHeight = current + 'px';
		// force reflow then collapse
		void box.offsetHeight;
		requestAnimationFrame(() => {
			box.style.maxHeight = '0px';
			box.style.opacity = '0';
			box.classList.remove('open');
		});

		card.classList.remove('active');
		card.setAttribute('aria-expanded', 'false');

		const cleanup = (e) => {
			// wait for max-height/opacity transition end
			if (!e || e.propertyName === 'max-height') {
				if (box.parentNode) box.parentNode.removeChild(box);
				openBox = null;
				openCard = null;
				document.removeEventListener('click', outsideClickHandler);
				document.removeEventListener('keydown', escHandler);
				box.removeEventListener('transitionend', cleanup);
			}
		};
		box.addEventListener('transitionend', cleanup);
		// fallback cleanup
		setTimeout(() => cleanup(), 420);
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
