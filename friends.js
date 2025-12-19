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
		document.addEventListener('DOMContentLoaded', () => { runEntrance(); attachAvatarListeners(); });
	} else {
		runEntrance();
		attachAvatarListeners();
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
		if (openCard && openCard !== card) {
			closeNote();
		}
		const box = createNoteBox(card);
		card.parentNode.insertBefore(box, card.nextSibling);
		const inner = box.querySelector('.friend-note-inner');
		box.style.maxHeight = '0px';
		box.style.opacity = '0';
		void box.offsetHeight;
		const target = inner.scrollHeight + 8;
		box.style.transition = 'max-height 320ms ease, opacity 220ms ease';
		requestAnimationFrame(() => {
			box.style.maxHeight = target + 'px';
			box.style.opacity = '1';
		});

		const onTransEnd = (e) => {
			if (e.propertyName === 'max-height') {
				box.style.maxHeight = 'none';
				box.removeEventListener('transitionend', onTransEnd);
			}
		};
		box.addEventListener('transitionend', onTransEnd);

		card.classList.add('active');
		card.setAttribute('aria-expanded', 'true');
		openBox = box;
		openCard = card;
	}

	function closeNote() {
		if (!openBox || !openCard) return;
		const box = openBox;
		const card = openCard;
		const current = box.scrollHeight;
		box.style.maxHeight = current + 'px';
		void box.offsetHeight;
		requestAnimationFrame(() => {
			box.style.maxHeight = '0px';
			box.style.opacity = '0';
		});
		const cleanup = (e) => {
			if (e.propertyName === 'max-height') {
				if (box && box.parentNode) box.parentNode.removeChild(box);
				openBox = null;
				openCard = null;
				card.classList.remove('active');
				card.setAttribute('aria-expanded', 'false');
				box.removeEventListener('transitionend', cleanup);
			}
		};
		box.addEventListener('transitionend', cleanup);
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
				setTimeout(() => {
					card.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}, 260);
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
