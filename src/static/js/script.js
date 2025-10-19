if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		const url = '/service-worker.js'
		navigator.serviceWorker.register(url).catch((err) => {
			console.debug('SW registration skipped:', err?.message || err)
		})
		if (/\/index\.html$/i.test(location.pathname)) {
			const pretty = location.pathname.replace(/\/index\.html$/i, '/') + location.search + location.hash;
			history.replaceState({}, '', pretty);
		}
	})
}

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { SplitText } from "gsap/SplitText"
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin.js'
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import {Howl, Howler} from 'howler'

gsap.config({ nullTargetWarn: false })
gsap.registerPlugin(ScrollTrigger, SplitText, ScrollSmoother, MorphSVGPlugin, ScrambleTextPlugin)

// Globals
let sections = document.querySelectorAll('main > section'),
	pageLang = document.querySelector('html').getAttribute('lang'),
	body,
	header,
	pageID,
	lastWindowWidth = 0,
	devMode = false,
	isFullScreen,
	vh,
	vh2,
	isTouch,
	musicHW,
	vol,
	isMusic,
	smoother;

window.addEventListener('load', onWindowLoad)
window.addEventListener('resize', onWindowResize)

// Window Load
function onWindowLoad() {

	body = document.querySelector('body')

	header = document.querySelector('header')

	pageID = body.id

	if( (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0)) ) {
		isTouch = true
		body.classList.add('isTouch')
	}

	body.classList.add('progress')

	onWindowResize()

	loadFonts()

	function handleFullscreenChange() {
		if (document.fullscreenElement) {
			isFullScreen = true
		} else {
			isFullScreen = false
		}
	}

	document.addEventListener('fullscreenchange', handleFullscreenChange);

}

// Fonts Load API
function loadFonts(){

	if(pageLang == 'en') {

		let loadedFonts = 0,
			fonts = [
			{
				name: 'Hubot Sans',
				src: 'url(/fonts/HubotSans-Regular.woff) format("woff"), url(/fonts/HubotSans-Regular.woff2) format("woff2")',
				options: { style: 'normal', weight: 400, 'display': 'swap' },
			},
			{
				name: 'Hubot Sans',
				src: 'url(/fonts/HubotSans-SemiBold.woff) format("woff"), url(/fonts/HubotSans-SemiBold.woff2) format("woff2")',
				options: { style: 'normal', weight: 600, 'display': 'swap' },
			}
		]


		fonts.forEach(function (font) {

			const fontFace = new FontFace(font.name, font.src, font.options)

			fontFace.load().then(function (loadedFont) {

				document.fonts.add(loadedFont)

				loadedFonts++

				if (loadedFonts === fonts.length) {

					onFontsLoad()

				}

			})

		})

	} else {

		onFontsLoad()

	}

}

// On Fonts Load
function onFontsLoad(){

	devMode ? devLoad() : pagesLoader()

	createSmooth()

	globals()

}

// Window Resize
function onWindowResize(){

	vh = window.innerHeight * 0.01
	vh2 = window.innerHeight * 0.01

	if(isTouch) {

		if(window.innerWidth != lastWindowWidth) { run() }

	} else {

		run()

	}

	function run(){

		body.classList.add('progress')

		setH()

	}

	document.documentElement.style.setProperty('--vh2', `${vh2}px`)

	function setH(){

		document.documentElement.style.setProperty('--vh', `${vh}px`)

		clearTimeout(window.resizedFinished)

		window.resizedFinished = setTimeout(function(){

			body.classList.remove('progress')

		}, 250)

	}

	lastWindowWidth = window.innerWidth

}

// Pages Loader
function devLoad(){

	gsap.set('._tempHide', { autoAlpha: 1 }, 0)

	appendImgs()

	landing()

	loader.remove()

	gsap.set(['_tempHide', '#smooth-wrapper', header], { autoAlpha: 1 })

	pageScroll()

}

function pagesLoader(){

	let loader = document.getElementById('loader'),
		loadTL = new gsap.timeline(),
		introSplitA = new SplitText('#intro ._hide', {type:"words", wordsClass:"SplitClass"})

	loadTL

	.set('._tempHide', { autoAlpha: 1 }, 0)

	.from('.loader_animation > span', 1, { scale: 0, ease: 'power3.out', stagger: 0.2 }, 0)

	.to('.loader_circle_rotate i', 1, { x: '-1em', y: '-1em', ease: 'power3.out', onStart: function(){

		body.classList.add('progress')

		appendImgs()

	} }, 0.75)

	.to('.loader_circle_rotate', 3, { rotate: 360, ease: 'power3.inOut' }, 0.75)

	.to('.loader_circle_rotate i', 1, { x: 0, y: 0, ease: 'power3.out' }, 3)

	.to('.loader_animation', 1, { x: '6.7em', y: '-0.7em', ease: 'power3.inOut' }, 3)

	.from('.loader_logo > svg path', 0.5, { y: '25%', autoAlpha: 0, ease: 'power3.out', stagger: 0.1 }, 3.5)

	.call(function(){

		landing()

		musicHW = new Howl({ src: ['/files/music.mp3'], loop: true })

	})

	.set(['#smooth-wrapper', header], { autoAlpha: 1 })

	.to('.loader_logo > svg path', 0.5, { y: '-25%', autoAlpha: 0, ease: 'power3.out', stagger: 0.1 }, 5)

	.to('.loader_animation', 0.5, { y: '-1em', autoAlpha: 0, ease: 'power3.out' }, 5.5)

	.call(function(){

		body.classList.remove('progress')

		pageScroll()

		loader.remove()

		musicHW.play()

		musicHW.volume(0.3)

		isMusic = true

	})

	.to('.site_loader > i', 1, { scaleY: 0, ease: 'power3.inOut' }, 5)

	.fromTo(introSplitA.words, 1, { blur: 10, y: '50%', autoAlpha: 0 }, { blur: 0, y: 0, autoAlpha: 1, ease: 'power3.out', stagger: 0.1 }, 5)

	.call(function(){

		disableScroll(false)

	})

	.fromTo('header ._ele', 1, { blur: 10, x: pageLang == 'en' ? '30%' : '-30%', autoAlpha: 0 }, { blur: 0, x: 0, autoAlpha: 1, ease: 'power3.out', stagger: 0.1 }, 5.5)
}

// GSAP Smoother
function createSmooth(){

	let nav = document.querySelector('nav')
	let links = document.querySelectorAll('nav li')

	gsap.set(smoother, { scrollTop: 0 })

	window.scroll(0, 0)

	smoother = ScrollSmoother.create({
		smooth: true,
		ignoreMobileResize: true,
		effects: true,
		smoothTouch: true,
		normalizeScroll: true
	});

	ScrollTrigger.create({
		onUpdate: function(e){

			pageScroll()

			links.forEach(function(link){ link.classList.remove('active') })

			if(e.progress > 0.06 && e.progress < 0.94 ) {

				nav.classList.add('has_active')

				if(e.progress > 0.06 && e.progress < 0.314257) {
					links[0].classList.add('active')
				}

				else if(e.progress > 0.314257 && e.progress < 0.471445) {
					links[1].classList.add('active')
				}

				else if(e.progress > 0.471445 && e.progress < 0.834987) {
					links[2].classList.add('active')
				}
				else if(e.progress > 0.834987 && e.progress < 0.895169) {
					links[3].classList.add('active')
				}
				else if(e.progress > 0.895169 && e.progress < 0.94) {
					links[4].classList.add('active')
				}

			} else {

				nav.classList.remove('has_active')

			}

		},
		invalidateOnRefresh: true,
		start: 0,
		end: "max",
	})

	devMode ? disableScroll(false) : disableScroll(true)

}

// Page Scroll Interactions
function pageScroll(){

	let eleWrap = document.querySelectorAll('._eleWrap')
	let splitWrap = document.querySelectorAll('._splitWrap')


	eleWrap.forEach(function(e, i){

		let $this = e,
			eleY = $this.querySelectorAll('._eleY'),
			eleX = $this.querySelectorAll('._eleX')

		if( ScrollTrigger.isInViewport(e) ) {
			animateEle($this, eleY, eleX)
		}

	})

	splitWrap.forEach(function(e, i){

		let $this = e,
			getWords = $this.querySelectorAll('._splitWords'),
			getLines = $this.querySelectorAll('._splitLines');


		if( ScrollTrigger.isInViewport(e) ) {
			getWords.forEach(function(e, i){
				split($this, e, null, i)
			})
			getLines.forEach(function(e, i){
				split($this, null, e, i)
			})
		}

	})

}

function animateEle($this, eleY, eleX) {

	if( !$this.classList.contains('inview') ) {

		$this.classList.add('inview')

		gsap.set($this, {autoAlpha: 1}, 0)

		if(eleY.length != 0) {
			gsap.set(eleY, { y: '30%', autoAlpha: 0})
			gsap.to(eleY, 1, { y: 0, autoAlpha: 1, ease: 'power3.out', delay: 0.25, stagger: 0.1 })
		}

		if(eleX.length != 0) {
			gsap.set(eleX, { x: 40, autoAlpha: 0})
			gsap.to(eleX, 1, { x: 0, autoAlpha: 1, ease: 'power3.out', delay: 0.25, stagger: 0.1 })
		}

	}

}

function split($this, getWords, getLines, i) {

	if(getWords && getWords.length != 0) {

		if( !getWords.classList.contains('inview') ) {

			getWords.classList.add('inview')

			gsap.set(getWords, {autoAlpha: 1}, 0)

			let splitWords = new SplitText(getWords, {type:"words", wordsClass:"SplitClass"});

			if(getWords.classList.contains('dirX')) {

				gsap.set(splitWords.words, { x: 30, autoAlpha: 0})
				gsap.to(splitWords.words, 0.7, { x: 0, autoAlpha: 1, ease: 'power3.out', stagger: 0.1, delay: 0.1, onComplete: function(){
					window.addEventListener('resize', function(){
						if(!getWords.classList.contains('no_revert')) { splitWords.revert() }	
					})
				} })

			} else {
				gsap.set(splitWords.words, { y: '100%', autoAlpha: 0})
				gsap.to(splitWords.words, 0.7, { y: 0, autoAlpha: 1, ease: 'power3.out', stagger: 0.1, delay: 0.1, onComplete: function(){
					window.addEventListener('resize', function(){
						if(!getWords.classList.contains('no_revert')) { splitWords.revert() }	
					})
				} })
			}

		}

	}

	if(getLines && getLines.length != 0) {

		if( !getLines.classList.contains('inview') ) {

			getLines.classList.add('inview')

			if(getLines && getLines.length != 0) {

				gsap.set(getLines, {autoAlpha: 1})
				let splitLines1 = new SplitText(getLines, {type:"lines", linesClass:"SplitClass"});
				let splitLines2 = new SplitText(getLines, {type:"lines", linesClass:"SplitWrap"});
				gsap.set(splitLines1.lines, { y: '100%'})
				gsap.to(splitLines1.lines, 0.7, { y: 0, autoAlpha: 1, ease: 'power3.out', stagger: 0.1, delay: 0.1, onComplete: function(){
					if(!$this.classList.contains('no_revert')) {
						window.addEventListener('resize', function(){
							splitLines1.revert()
						})
					}
				} })

			}

		}

	}

}

// Disable / Enable Page Scroll
function disableScroll(val){

	body.style.overflow = val == true ? 'hidden' : 'auto'

	if(smoother) { smoother.paused(val) }

}

// Global Functions
function globals(isGlobal){

	// Srcoll to
	let scrollEle = document.querySelectorAll('.scrollTo')

	scrollEle.forEach(e => {
		e.addEventListener('click', () => {
			let id = e.dataset.scroll,
				offset = id === 'end' 
				? document.body.scrollHeight - window.innerHeight
				: id 
				? document.getElementById(id).getBoundingClientRect().top + window.pageYOffset 
				: 0;

			gsap.to(smoother, {
				scrollTop: offset,
				duration: 2,
				ease: 'power3.inOut'
			});
		});
	});

	// Magnet
	const magnetElements = document.querySelectorAll('.magnet')
	new MagnetClass(magnetElements)

	// Interactive Labels
	const interactiveLabels = document.querySelectorAll('.interactive_label')
	new InteractiveLabelsClass(interactiveLabels)

	blur()

	burger()

	music()


}

// Musci
function music() {

	const containers = Array.from(document.querySelectorAll('.music'))
	if (!containers.length) return;

	const CFG = {
		lineWidth: 2,
		shadowBlur: 10,
		baseAmplitude: 5,
		wavelengthPx: 20,
		speed: 0.003,
		easeMs: 120,
		strokeA: '#eee',
		strokeB: '#fff'
	};

	let playing   = true;
	let ampTarget = CFG.baseAmplitude;
	let amp       = 0;
	let phase     = 0;
	let rafId     = null;
	let lastT     = performance.now();

	const inst = containers.map(container => {

		const btn    = container.querySelector('.wavy_btn');
		const canvas = btn.querySelector('canvas');
		const ctx    = canvas.getContext('2d');

		sizeCanvas(btn, canvas, ctx);
		setPressedAttr(btn, true);

		container.addEventListener('click', toggle);
		container.addEventListener('keydown', e => {
			if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
		});

		return { container, btn, canvas, ctx };

	});

	window.addEventListener('resize', onResize, { passive: true });

	lastT = performance.now();
	rafId = requestAnimationFrame(draw);

	function setPressedAttr(btn, on) {
		btn.setAttribute('aria-pressed', on ? 'true' : 'false');
	}

	function onResize() {
		inst.forEach(({ btn, canvas, ctx }) => sizeCanvas(btn, canvas, ctx));
		if (!rafId) {
			lastT = performance.now();
			rafId = requestAnimationFrame(draw);
		}
	}

	function sizeCanvas(btn, canvas, ctx) {
		const dpr = Math.max(1, window.devicePixelRatio || 1);
		const rect = btn.getBoundingClientRect();
		const cssW = Math.max(1, rect.width);
		const cssH = Math.max(1, rect.height);

		canvas.width  = Math.round(cssW * dpr);
		canvas.height = Math.round(cssH * dpr);
		canvas.style.width = cssW + 'px';
		canvas.style.height = cssH + 'px';

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const g = ctx.createLinearGradient(0, 0, cssW, 0);
		g.addColorStop(0, CFG.strokeA);
		g.addColorStop(1, CFG.strokeB);
		ctx.lineWidth = CFG.lineWidth;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.strokeStyle = g;
		ctx.shadowColor = CFG.strokeA + 'AA';
		ctx.shadowBlur = CFG.shadowBlur;
	}

	function easeTo(current, target, dtMs, easeMs) {

		if (easeMs <= 0) return target;
		const k = Math.exp(-dtMs / easeMs);
		return target + (current - target) * k;

	}

	function draw(now) {

		const dt = Math.min(50, now - lastT);
		lastT = now;

		if (playing) phase += CFG.speed * dt;
		amp = easeTo(amp, ampTarget, dt, CFG.easeMs);

		const k = (Math.PI * 2) / CFG.wavelengthPx;

		for (const { canvas, ctx } of inst) {

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			const cy = h / 2;

			if (Math.abs(amp) < 0.05) {
				ctx.beginPath();
				ctx.moveTo(0, cy);
				ctx.lineTo(w, cy);
				ctx.stroke();
				} else {
				ctx.beginPath();
				const step = 2;
				for (let x = 0; x <= w; x += step) {
					const y = cy + Math.sin(x * k + phase) * amp;
					if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
				}
				ctx.stroke();
			}

		}

		const needsMore = playing || Math.abs(amp - ampTarget) > 0.02;
		rafId = needsMore ? requestAnimationFrame(draw) : null;
	}

	function play() {
		if (playing) return;
		playing = true;
		ampTarget = CFG.baseAmplitude;
		vol = 1; isMusic = true;
		inst.forEach(({ btn }) => setPressedAttr(btn, true));
	}

	function pause() {
		if (!playing) return;
		playing = false;
		ampTarget = 0;
		vol = 0; isMusic = false;
		inst.forEach(({ btn }) => setPressedAttr(btn, false));
	}

	function toggle() {
		(playing ? pause : play)();
		if (!rafId) {
			lastT = performance.now();
			rafId = requestAnimationFrame(draw);
		}
		musicHW.volume(vol / 3)
	}

}

// Burger
function burger(){

	let burgerWrap = document.querySelector('.burger_wrap'),
		burgerButton = document.querySelector('.burger_button'),
		burgerClose = document.querySelector('.burger_close'),
		burgerLinks = document.querySelectorAll('.burger_links'),
		burgerEle = document.querySelectorAll('.burger_wrap ._ele'),
		burgerTL = new gsap.timeline({ paused: true }),
		isBurger

	burgerTL

	.set('.burger_wrap', { autoAlpha: 1 }, 0)

	.fromTo('.main_logo > svg', 0.5, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: '-100%', ease: 'power3.in' }, 0)

	.fromTo('.main_logo > strong', 0.5, { autoAlpha: 0, y: '100%' }, { autoAlpha: 1, y: 0, ease: 'power3.out' }, 0.5)

	.fromTo('.burger_wrap > i', 0.5, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power3.inOut' }, 0)

	.fromTo('.burger_cta > i', 0.5, { scaleX: 0 }, { scaleX: 1, stagger: 0.1, ease: 'power3.out' }, 0.25)

	.fromTo('.burger_button > i', 0.5, { scaleX: 1 }, { scaleX: 0, stagger: 0.1, ease: 'power3.in' }, 0)

	.fromTo('.burger_close', 0.5, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, ease: 'power3.out' }, 0.6)

	.fromTo('.burger_close > span > i', 0.5, { scaleX: 0 }, { scaleX: 1, stagger: 0.2, ease: 'power3.out' }, 0.6)

	.fromTo(burgerEle, 0.5, { y: '50%', autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.025, ease: 'power3.out' }, 0.7)

	burgerEle.forEach(function(e){

		e.addEventListener('click', function(){

			closeBurger()

		})

	})


	burgerButton.addEventListener('click', function(){

		if(!isBurger) {

			disableScroll(true)

			isBurger = true

			burgerTL.play()

		}

	})

	burgerClose.addEventListener('click', function(){

		closeBurger()

	})

	burgerLinks.forEach(function(e){

		e.addEventListener('click', function(){

			closeBurger()

		})

	})

	function closeBurger(){

		if(isBurger) {

			isBurger = false

			burgerTL.reverse()

			disableScroll(false)

		}

	}

	document.addEventListener('keydown', function(event) {

		if (event.key === 'Escape') { closeBurger() }

	})

}

// Main App
function landing(){

	let pinWraps = document.querySelectorAll('.basic_pin_wrap'),
		listBlocks = document.querySelectorAll('.list_block'),
		teamNum = document.querySelectorAll('.team_num'),
		tm = document.querySelectorAll('.section_team_content'),
		tmP = document.querySelectorAll('.media-team'),
		openList = document.querySelectorAll('.open_list'),
		moreWrap = document.querySelector('.more_wrap'),
		moreButton = document.querySelector('.more_button'),
		videoWraps = document.querySelectorAll('.list_video_wrap'),
		rotate = document.querySelectorAll('._rotate'),
		servicesSection = document.querySelectorAll('.section-service-wrap'),
		listTL = gsap.timeline({ paused: true }),
		circleTL2 = gsap.timeline({ paused: true }),
		circlesRevTL = gsap.timeline({ paused: true })

	let curCase = 'case-1',
		introTL,
		casesTL,
		tmTL,
		introSplitA,
		introSplitB,
		contSplitA,
		contSplitB,
		listPins,
		wordsTL

	const Mina = (() => {

		const jsonCache = new Map();
		const imgCache  = new Map();

		function loadJSON(url) {
			if (!jsonCache.has(url)) {
				jsonCache.set(url, fetch(url, { cache: 'force-cache' }).then(r => {
					if (!r.ok) throw new Error(`JSON 404: ${url}`);
					return r.json();
				}));
			}
			return jsonCache.get(url);
		}

		async function loadImage(url) {
		if (!imgCache.has(url)) {
			imgCache.set(url, (async () => {
				try {
					const r = await fetch(url, { cache: 'force-cache' });
					if (!r.ok) throw new Error(`Image 404: ${url}`);
					const blob = await r.blob();
					if ('createImageBitmap' in window) {
						return await createImageBitmap(blob);
					}
					const im = new Image();
					im.decoding = 'async';
					im.src = URL.createObjectURL(blob);
					await (im.decode?.() || new Promise((res, rej) => { im.onload = res; im.onerror = rej; }));
					return im;
				} catch {
					const im = new Image();
					im.decoding = 'async';
					im.src = url;
					await (im.decode?.() || new Promise((res, rej) => { im.onload = res; im.onerror = rej; }));
					return im;
				}
				})());
			}
			return imgCache.get(url);
		}

		return { loadJSON, loadImage };

	})()

	const io = new IntersectionObserver((entries) => {

		entries.forEach(({ target, isIntersecting }) => {
			const api = target.__SV_API__;
			if (!api) return;
			if (isIntersecting) api.mount();
			else api.unmount();
		});

	}, { root: null, rootMargin: '800px 0px', threshold: 0.01 })

	listTL

	.fromTo('.media_cases', 0.5, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power3.inOut' }, 0)

	.fromTo('.list_bg', 1, { scaleX: 0 }, { scaleX: 1, ease: 'power3.inOut' }, 0)

	.fromTo('.list_side_wrap', 1, { x: pageLang == 'en' ? '100%' : '-100%' }, { x: 0, ease: 'power3.inOut' }, 0)

	.fromTo('.list_block', 1, { y: '20%' }, { y: 0, ease: 'power3.out', stagger: 0.1 }, 0)

	.to('.circle_title span', 1, { autoAlpha: 0 }, 0)


	circlesRevTL

	.fromTo('._circle', 1, { scale: 0 }, { scale: 1, ease: 'power3.inOut', stagger: 0.1 }, 0)

	.fromTo('.circle_title', 1, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power3.inOut', stagger: 0.1 }, 0.5)


	rotate.forEach(function(target){

		const DEG_PER_PX = target.dataset.dist

		const tl = gsap.timeline({
			scrollTrigger: {
				start: 0,
				end: "max",
				scrub: true,
				invalidateOnRefresh: true,
				defaults: { ease: "none" },
			}
		})

		tl.to(target, {
			rotation: () => ScrollTrigger.maxScroll(window) * DEG_PER_PX,
			modifiers: {
				rotation: (v) => {
					const n = parseFloat(v);
					const wrapped = ((n % 360) + 360) % 360;
					return wrapped + "deg";
				}
			}
		})

	})

	videoWraps.forEach(wrap => {

	  	let firstItem = wrap.querySelector('.list_video_item'),
	  		videoItems = wrap.querySelectorAll('.list_video_item')

		videoItems.forEach(function(videoItem){

			videoItem.addEventListener('click', function(){

				let parentNode = videoItem.closest('.list_block_content'),
					videoNode = parentNode.querySelector('.list_video_set'),
					getIcon = videoItem.querySelector('.video_icon path'),
					video

				if(!videoItem.classList.contains('active')) {

					videoItems.forEach(function(e){

						let vc = e.querySelector('.video_icon path')

						e.classList.remove('active')

						gsap.to(vc, 0.5, { morphSVG: "M4 3h2v10H4zM10 3h2v10h-2z", ease: "power3.out" })

					})

					videoItem.classList.add('active')

					parentNode = videoItem.closest('.list_block_content')
					videoNode = parentNode.querySelector('.list_video_set')

					let src = videoItem.dataset.video,
						getVideo = videoNode.querySelector('video'),
						videoElement = document.createElement("video"),
						sourceMP4 = document.createElement("source")

					if(getVideo) { getVideo.remove() }

					videoElement.controls = true
					videoElement.muted = true
					videoElement.autoplay = true
					videoElement.loop = true
					videoElement.playsinline = true

					sourceMP4.src = src
					sourceMP4.type = "video/mp4"
					videoElement.appendChild(sourceMP4)

					videoNode.appendChild(videoElement)

					gsap.to(getIcon, 0.5, { morphSVG: "M4 3.26v9.481c0 .2.203.325.366.225l7.515-4.74c.16-.1.16-.347 0-.447L4.366 3.038C4.203 2.935 4 3.06 4 3.26", ease: "power3.out" })

				} else {

					video = videoNode.querySelector('video')

					if(!videoItem.classList.contains('paused')) {

						videoItem.classList.add('paused')

						if(video) { video.pause() }

						gsap.to(getIcon, 0.5, { morphSVG: "M4 3h2v10H4zM10 3h2v10h-2z", ease: "power3.out" })

					} else {

						videoItem.classList.remove('paused')

						if(video) { video.play() }

						gsap.to(getIcon, 0.5, { morphSVG: "M4 3.26v9.481c0 .2.203.325.366.225l7.515-4.74c.16-.1.16-.347 0-.447L4.366 3.038C4.203 2.935 4 3.06 4 3.26", ease: "power3.out" })

					}

				}

				document.addEventListener('fullscreenchange', function() {

					video = videoNode.querySelector('video')

					if (document.fullscreenElement === video) {
						disableScroll(true)
					} else if (document.fullscreenElement === null) {
						disableScroll(false)
					}

				})

			})

		})

		if (firstItem) {

			firstItem.click()

		}

	})

	moreButton.addEventListener('click', function(e){

		moreWrap.classList.contains('active') ? moreWrap.classList.remove('active') : moreWrap.classList.add('active')

	})

	start.addEventListener("click", () => {

		if (introTL.scrollTrigger !== null) {

			gsap.to(smoother, {
				scrollTop: introTL.scrollTrigger.labelToScroll('section1'),
				duration: 1,
				ease: 'power3.inOut'
			})
		}

	})

	listBlocks.forEach(function(e, i){

		let parentSection = e.closest('.list_side_wrap'),
			listWrap = document.querySelector('.list_pin_wrap'),
			pinDiv = document.createElement('div')

		pinDiv.classList.add('list_pin', e.dataset.id)

		listWrap.appendChild(pinDiv)

		e.addEventListener('click', function(){

			gsap.set(smoother, {
				scrollTop: pinDiv.getBoundingClientRect().top + window.pageYOffset + 5,
			})

		})

	})

	servicesSection.forEach((section, iSection) => {

		const canvas = section.querySelector('canvas');

		if (!canvas) return;

		const ctx      = canvas.getContext('2d');
		const root     = section.dataset.frames || '';
		const SHEETS   = Math.max(0, parseInt(section.dataset.count, 10) || 0);
		const stId     = 'sv-' + iSection;

		const frames   = { val: 0 };
		let framesMap  = [];
		let tl         = null;
		let st         = null;
		let DPR        = 1;
		let mounted    = false;

		function drawFrame(index) {

			if (!framesMap.length) return;
			const i = Math.max(0, Math.min(framesMap.length - 1, Math.round(index)));
			const F = framesMap[i];
			if (!F || !F.img) return;

			const dw = canvas.width, dh = canvas.height;

			const scale = Math.max(dw / F.srcW, dh / F.srcH);
			const baseW = F.srcW * scale, baseH = F.srcH * scale;
			const baseX = (dw - baseW) * 0.5;
			const baseY = (dh - baseH) * 0.5;

			const dX = baseX + F.offX * scale;
			const dY = baseY + F.offY * scale;
			const dW = F.sw * scale;
			const dH = F.sh * scale;

			ctx.clearRect(0, 0, dw, dh);

			if (F.rotated) {
				ctx.save();
				ctx.translate(dX, dY);
				ctx.rotate(-Math.PI / 2);
				ctx.drawImage(F.img, F.sx, F.sy, F.sw, F.sh, -dH, 0, dH, dW);
				ctx.restore();
			} else {
				ctx.drawImage(F.img, F.sx, F.sy, F.sw, F.sh, dX, dY, dW, dH);
			}

		}

		async function loadSheet(root, sheetIndex) {
			const jsonURL  = `${root}texture-${sheetIndex}.json`;
			const atlas    = await Mina.loadJSON(jsonURL);
			const metaImg  = atlas?.meta?.image;
			if (!metaImg) throw new Error(`meta.image missing in ${jsonURL}`);
			const imgURL   = `${root}${metaImg}`;
			const img      = await Mina.loadImage(imgURL);

			const out = [];
			const framesObj = atlas.frames || {};
			for (const name in framesObj) {
				const f = framesObj[name];
				out.push({
				idx: parseIndexFromName(name),
				img,
				sx: f.frame.x,  sy: f.frame.y,  sw: f.frame.w,  sh: f.frame.h,
				rotated: !!f.rotated,
				srcW: f.sourceSize?.w ?? f.frame.w,
				srcH: f.sourceSize?.h ?? f.frame.h,
				offX: f.spriteSourceSize?.x ?? 0,
				offY: f.spriteSourceSize?.y ?? 0
				});
			}
			out.sort((a,b) => a.idx - b.idx);
			return out;
		}

		function appendFramesAndRebuild(newFrames) {

			if (!newFrames?.length) return;
				framesMap = framesMap.concat(newFrames);
				framesMap.sort((a,b) => a.idx - b.idx);
				let savedProgress = 0;
				if (st) {
				savedProgress = st.progress || 0;
			}

			buildOrRebuildTimeline(savedProgress);

		}

		function buildOrRebuildTimeline(restoreProgress = 0) {

			if (tl) { tl.kill(); tl = null; }
			const old = ScrollTrigger.getById(stId);
			if (old) old.kill(true);
			st = null;

			DPR = sizeCanvas(canvas);
			drawFrame(frames.val);

			const last = Math.max(0, framesMap.length - 1);

			tl = gsap.timeline({
				scrollTrigger: {
					id: stId,
					trigger: section,
					start: '0% 100%',
					end: () => `+=${ window.innerHeight * 2 }`,
					scrub: true
				}
			})

			.fromTo(frames, { val: 0 }, { val: last, onUpdate: () => drawFrame(frames.val), ease: 'none', duration: 0.5 + 1.25, snap: { val: 1 } }, 0)

			.fromTo(section.querySelector('.sides_set'), { filter:'blur(0px)', autoAlpha:1 }, { filter:'blur(10px)', autoAlpha:0, duration:0.5 }, 1.25)

			st = ScrollTrigger.getById(stId);

			if (st && Number.isFinite(restoreProgress)) {
				const start = st.start;
				const end   = st.end;
				const y     = start + restoreProgress * (end - start);
				st.scroll(y);
				st.refresh();
				const idx = Math.round((framesMap.length - 1) * (st.progress || 0));
				drawFrame(idx);
			}

		}

		function onResize() {

			DPR = sizeCanvas(canvas);

			if (st) st.refresh();

			if (st && framesMap.length) {
				const idx = Math.round((framesMap.length - 1) * (st.progress || 0));
				drawFrame(idx);
			} else {
					drawFrame(frames.val);
			}

		}

		async function mount() {

			if (mounted) return;
			mounted = true;

			DPR = sizeCanvas(canvas);

			let firstLoaded = false;

			for (let i = 0; i < SHEETS; i++) {

				try {

					const framesFirst = await loadSheet(root, i);

					framesMap = framesFirst.slice();

					buildOrRebuildTimeline(0);

					firstLoaded = true;

					const remaining = [];
					for (let j = 0; j < SHEETS; j++) if (j !== i) remaining.push(j);

					const concurrency = 2;
					let cursor = 0;

					async function worker(){

						while (cursor < remaining.length) {
							const idx = remaining[cursor++];
							try {
								const more = await loadSheet(root, idx);
								appendFramesAndRebuild(more);
							} catch (e) {
								console.warn('Sheet load failed:', idx, e);
							}
						}
					}

					const workers = Array.from({ length: Math.min(concurrency, remaining.length) }, worker);

					Promise.allSettled(workers);
					break;

				} catch (e) {

					// try next index if one is missing
					continue;

				}
			}

			if (!firstLoaded) {
				console.error('No atlas sheets could be loaded for section', iSection);
				mounted = false;
				return;
			}

			window.addEventListener('resize', onResize, { passive: true });

		}

		function unmount() {

			window.removeEventListener('resize', onResize);

			if (tl) { tl.kill(); tl = null; }

			const old = ScrollTrigger.getById(stId);

			if (old) old.kill(true);

			st = null;

			framesMap = [];

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			mounted = false;

		}

		section.__SV_API__ = { mount, unmount }
		io.observe(section)
	
	})

	function capDPR(maxDPR = 1.75) {

		return Math.min(window.devicePixelRatio || 1, maxDPR);

	}

	function sizeCanvas(canvas, targetPx = null) {
		const DPR = capDPR(1.75);
		const logical = targetPx ?? Math.min(window.innerHeight, 1280);
		canvas.style.width  = `${logical}px`;
		canvas.style.height = `${logical}px`;
		canvas.width  = Math.round(logical * DPR);
		canvas.height = Math.round(logical * DPR);
		return DPR;
	}

	function parseIndexFromName(name) {
		const m = name.match(/\d+/);
		return m ? parseInt(m[0], 10) : Number.NaN;
	}

	function updateCover(targetID, mediaID, noScale){

		if( ScrollTrigger.getById('pin-' + mediaID) )   { ScrollTrigger.getById('pin-' + mediaID).kill(true) }

		gsap.timeline({
			scrollTrigger: {
				id: 'pin-' + mediaID,
				invalidateOnRefresh: true,
				trigger: '#' + targetID,
				start: '0% 100%',
				end: () => `+=${ window.innerHeight }`,
				scrub: true
			},
			defaults:{ ease:'none' }
		})

		.fromTo('#' + mediaID, 1, { autoAlpha: 0 }, { autoAlpha: 1 }, 0)

		.fromTo('#' + mediaID, 2, { blur: 20, scale: noScale ? 1 : 1.1 }, { blur: 0, scale: 1 }, 0)

	}

	function spanCounter(startLabel, endLabel, idx){

		tmTL.to('.team_counter_animation',
			{
				y: () => -teamNum[idx].offsetTop,
				duration: () => tmTL.labels[endLabel] - tmTL.labels[startLabel]
			},
			startLabel
		)

	}

	function excute(listPin){

		let getIndex = Array.from(listPin.parentNode.children).indexOf(listPin)

		listBlocks.forEach(function(e){

			let thisIndex = Array.from(e.parentNode.children).indexOf(e),
				getID

			e.classList.remove('active')

			if(thisIndex == getIndex) {

				e.classList.add('active')

				getID = e.dataset.id

				if(curCase != getID) { playCase(getID, true) }

				curCase = getID

			}

		})

	}

	function playCase(getID, val){

		let target = document.getElementById(getID)

		if(casesTL){ casesTL.kill() }

		casesTL = new gsap.timeline()

		casesTL

		.to('.title_set.floating', 0.5, { blur: 0, autoAlpha: 0, ease: 'power3.in' }, 0)

		.fromTo(target, 0.5, { blur: 10, autoAlpha: 0 }, { blur: 0, autoAlpha: 1, ease: 'power3.out' }, 0.5)

		if(val) {

			casesTL

			.to('.media_cases_block', 0.5, { autoAlpha: 0 }, 0)

			.fromTo('#media-' + getID, 0.5, { autoAlpha: 0, blur: 20 }, { autoAlpha: 1, blur: 0 }, 0)

		}

	}

	function resize(){

		clearTimeout(window.hResized)

		window.hResized = setTimeout(function(){

			build()

		}, 50)

		build()

	}

	function updateWords(wordsArr) {

		let titles = document.querySelectorAll('.circle_title')

		if(wordsTL) {wordsTL.kill()}

		const items = JSON.parse(wordsArr);

		titles.forEach(function(e, i){

			let span = e.querySelector('span')

			span.innerHTML = items[i]

			let split,
				width = span.offsetWidth

			split = new SplitText(span, {type:"chars", charsClass:"SplitClass"})

			gsap.fromTo(split.chars, {
				autoAlpha: 0
			}, {
				duration: 0.05,
				autoAlpha: 1,
				ease: "none",
				stagger: {
					each: 0.05,
					onStart: function() {
						let currentChar = this.targets()[0].textContent;
						gsap.to(this.targets(), { duration: 0.5, scrambleText: { text: currentChar, chars: "upperAndLowerCase", speed: 0.5 } })
					},
				},
				onComplete: function(){
					if(pageLang == 'ar') {
						span.innerHTML = items[i]
					}
				}
			})

		})

	}

	const p = { v: 0 };

	const progressCanvas = document.getElementById('progressCanvas');
	const progressBar = new WavyProgressBar(progressCanvas, {
		height: 20,
		lineWidth: 2,
		progressColor: '#FE4B33',
		tipLength: 56,
		amplitude: 6,
		wavelength: 40,
		speed: 0.01,
		baseColor: 'rgba(255,255,255,0.3)',
		bgLineWidth: 2
	})

	let setBar = () => progressBar.set(p.v)

	function build() {

		if( ScrollTrigger.getById('introTrigger') ) { ScrollTrigger.getById('introTrigger').kill(true) }
		if( ScrollTrigger.getById('teamTrigger') ) { ScrollTrigger.getById('teamTrigger').kill(true) }
		if( ScrollTrigger.getById('contactTrigger') ) { ScrollTrigger.getById('contactTrigger').kill(true) }

		if( ScrollTrigger.getById('trigger-intro')) ScrollTrigger.getById('trigger-intro').kill(true)
		if( ScrollTrigger.getById('trigger-section-services')) ScrollTrigger.getById('trigger-section-services').kill(true)
		if( ScrollTrigger.getById('trigger-services')) ScrollTrigger.getById('trigger-services').kill(true)
		if( ScrollTrigger.getById('trigger-join')) ScrollTrigger.getById('trigger-join').kill(true)
		if( ScrollTrigger.getById('trigger-cases-intro')) ScrollTrigger.getById('trigger-cases-intro').kill(true)

		if( introTL ) { introTL.kill() }
		if( tmTL ) { tmTL.kill() }
		if( introSplitA ) { introSplitA.revert() }
		if( introSplitB ) { introSplitB.revert() }
		if( contSplitA ) { contSplitA.revert() }
		if( contSplitB ) { contSplitB.revert() }

		introSplitA = new SplitText('#intro ._hide', {type:"words", wordsClass:"SplitClass"})
		introSplitB = new SplitText('#intro ._show', {type:"words", wordsClass:"SplitClass"})

		contSplitA = new SplitText('#contact ._hide', {type:"words", wordsClass:"SplitClass"})
		contSplitB = new SplitText('#contact ._show', {type:"words", wordsClass:"SplitClass"})

		// Covers
		updateCover('section-services-intro', 'media-services-intro')
		updateCover('section-services', 'media-services')
		updateCover('section-cases-intro', 'media-cases-intro')
		updateCover('section-cases', 'media-case-1')
		updateCover('section-team-intro', 'media-team-intro')
		updateCover('section-team', 'media-team', true)
		updateCover('section-join', 'media-join')
		updateCover('section-invest', 'media-invest')

		pinWraps.forEach(function(pinWrap, i){

			let pinSection = pinWrap.querySelector('.basic_pin')

			if( ScrollTrigger.getById('pin-' + i) )       { ScrollTrigger.getById('pin-' + i).kill(true) }
			if( ScrollTrigger.getById('pin-tl-' + i) )    { ScrollTrigger.getById('pin-tl-' + i).kill(true) }

			ScrollTrigger.create({
				id: 'pin-' + i,
				invalidateOnRefresh: true,
				trigger: pinSection,
				endTrigger: pinWrap,
				start: '0% 0%',
				end: '100% 100%',
				pin: true,
				pinSpacing: true,
			})

			gsap.timeline({
				scrollTrigger: {
					id: 'pin-tl-' + i,
					invalidateOnRefresh: true,
					trigger: pinWrap,
					start: '100% 100%',
					end: () => `+=${ window.innerHeight / 2 }`,
					scrub: true
				},
				defaults:{ ease:'none', duration: 2 }
			})

			.fromTo(pinSection, 1, { blur: 0, autoAlpha: 1 }, { blur: 10, autoAlpha: 0 }, 0)

		})

		listPins = document.querySelectorAll('.list_pin')

		listPins.forEach(function(e, i){

			if( ScrollTrigger.getById('listPins-' + i) )  { ScrollTrigger.getById('listPins-' + i).kill(true) }

			ScrollTrigger.create({
				id: 'listPins-' + i,
				trigger: e,
				start: '0% 0%',
				onEnter:     () => { excute(e) },
				onEnterBack: () => { excute(e) }
			})

		})

		openList.forEach(function(e, i){

			if( ScrollTrigger.getById('openList-' + i) )  { ScrollTrigger.getById('openList-' + i).kill(true) }

			ScrollTrigger.create({
				id: 'openList-' + i,
				trigger: e,
				start: '0% 25%',
				end: '100% 100%',
				onEnter:     () => { listTL.play(); circlesRevTL.play(); listWrap.style.pointerEvents = 'auto' },
				onEnterBack: () => { listTL.play(); circlesRevTL.play(); listWrap.style.pointerEvents = 'auto' },
				onLeave:     () => { listTL.reverse(); circlesRevTL.reverse(); if(!isFullScreen) {listWrap.style.pointerEvents = 'none'} },
				onLeaveBack: () => { listTL.reverse(); listWrap.style.pointerEvents = 'none' }
			})

		})

		sections.forEach(function(section, i){

			let wordsArr = section.dataset.circle

			if(wordsArr) {

				if( ScrollTrigger.getById('trigger-section-' + i) ) { ScrollTrigger.getById('trigger-section-' + i).kill(true) }

				ScrollTrigger.create({
					id: 'trigger-section-' + i,
					trigger: section,
					start: '0% 50%',
					end: '100% 100%',
					onEnter: () => { updateWords(wordsArr) },
					onEnterBack: () => { updateWords(wordsArr) },
				})

			}

		})

		// Intro
		introTL = gsap.timeline({
			scrollTrigger: {
				id: 'introTrigger',
				invalidateOnRefresh: true,
				trigger: '.section-intro-pin',
				endTrigger: '.section-intro-wrap',
				start: '0% 0%',
				end: '100% 100%',
				scrub: true
			},
			defaults:{ ease:'none' }
		})

		.to(p, { duration: 2.5, v: 0.12, onUpdate: setBar, startAt: { v: () => p.v }, immediateRender: false, overwrite: 'auto' }, 0)

		.fromTo('#media-intro', 1.5, { blur: 10 }, { blur: 0 }, 0)

		.fromTo(introSplitA.words, 0.3, { blur: 0, autoAlpha: 1, scale: 1 }, { blur: 10, autoAlpha: 0, stagger: 0.1, scale: 0.98 }, 0)

		.fromTo('#intro ._fadeOut', 0.5, { autoAlpha: 1 }, { autoAlpha: 0 }, 0)

		.fromTo(introSplitB.words, 0.3, { blur: 10, autoAlpha: 0, scale: 0.98 }, { blur: 0, autoAlpha: 1, stagger: 0.1, scale: 1 }, 0.65)

		.fromTo('#intro ._fadeIn', 0.5, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.5)

		.addLabel("section1")

		.to('#intro ._fadeIn', 1, { autoAlpha: 1 })


		ScrollTrigger.create({
			id: 'trigger-intro',
			trigger: '#section-intro',
			start: '0% 50%',
			end: '100% 50%',
			onEnterBack: () => { circlesRevTL.reverse() },
			onLeave:     () => { circlesRevTL.play() },
		})


		// Contact
		gsap.timeline({
			scrollTrigger: {
				id: 'contactTrigger',
				invalidateOnRefresh: true,
				trigger: '.section-contact-pin',
				endTrigger: '.section-contact-wrap',
				start: '0% 0%',
				end: '100% 100%',
				pin: true,
				pinSpacing: false,
				scrub: true
			},
			defaults:{ ease:'none', duration: 1.5 }
		})

		.fromTo('.media_contact_bg', 1.5, { 

			y: function(i, el){

				let height = el.offsetHeight

				return - (height - window.innerHeight)

			}

		 }, { y: 0 }, 0)

		.fromTo(contSplitA.words, 0.3, { blur: 0, autoAlpha: 1, scale: 1 }, { blur: 10, autoAlpha: 0, stagger: 0.1, scale: 0.98 }, 0)

		.fromTo(contSplitB.words, 0.3, { blur: 10, autoAlpha: 0, scale: 0.98 }, { blur: 0, autoAlpha: 1, stagger: 0.1, scale: 1 }, 0.65)

		.fromTo('#contact ._move', 1.5, { y: 0 }, { y: function(i, el){

			return pageLang == 'en' ? - (window.innerHeight - (el.offsetHeight * 1.7)) : - (window.innerHeight - (el.offsetHeight * 1.9))

		} }, 0)

		.fromTo('#contact ._fadeOut', 0.25, { autoAlpha: 1 }, { autoAlpha: 0 }, 0.25)

		.fromTo('.info_set', 0.25, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.75)

		.fromTo('footer', 0.25, { y: '100%' }, { y: 0 }, 0.75)

		.to('.circles_inner', 1, { x: function(){

			return pageLang == 'en' ? window.innerWidth / 4 : -window.innerWidth / 4

		}}, 0)

		// Services Intro
		gsap.timeline({
			scrollTrigger: {
				id: 'trigger-section-services',
				invalidateOnRefresh: true,
				trigger: '#section-services-intro',
				start: '0% 0%',
				end: '100% 100%',
				scrub: true
			},
			defaults:{ ease:'none' }
		})

		.fromTo('.circle_small', 1, { x: 0, y: 0 }, { x: '-17em', y: '-17em' }, 0)


		// Services
		gsap.timeline({
			scrollTrigger: {
				id: 'trigger-services',
				invalidateOnRefresh: true,
				trigger: '#section-services',
				start: '0% 50%',
				end: () => `+=${ window.innerHeight / 2 }`,
				scrub: true
			},
			defaults:{ ease:'none' }
		})

		.to('.circles_inner', 1, { x: function(){

			return pageLang == 'en' ? window.innerWidth / -4 : window.innerWidth / 4

		}}, 0)


		// Join Intro
		ScrollTrigger.create({
			id: 'trigger-join',
			trigger: '#section-join',
			start: '0% 25%',
			end: '100% 100%',
			onEnter:     () => { circlesRevTL.play() },
			onLeaveBack: () => { circlesRevTL.reverse() },
		})

		// Cases Intro
		gsap.timeline({
			scrollTrigger: {
				id: 'trigger-cases-intro',
				invalidateOnRefresh: true,
				trigger: '#section-cases-intro',
				start: '0% 50%',
				end: () => `+=${ window.innerHeight }`,
				scrub: true
			},
			defaults:{ ease:'none' }
		})

		.to('.circles_inner', 1, { x: 0 }, 0)


		// Team
		const tl = gsap.timeline({
				scrollTrigger: {
				id: 'teamTrigger',
				invalidateOnRefresh: true,
				trigger: '.section-team-pin',
				endTrigger: '.section-team-wrap',
				start: '0% 0%',
				end: '100% 100%',
				snap: { snapTo: 'labels', duration: { min: 0.2, max: 0.5 }, ease: 'power3.out' },
				scrub: true
			},
			defaults: { ease: 'none' }
		});

		const L = tm.length;

		for (let i = 0; i < L - 1; i++) {
		const start = `L${i}`;
		const end   = `L${i + 1}`;

		tl.addLabel(start);

		if (i === 0) {
			tl.fromTo(tm[0],  0.5, { blur: 0,  autoAlpha: 1, y: '0%'  }, { blur: 10, autoAlpha: 0, y: window.innerHeight * -0.02 }, '+=1');
			tl.fromTo(tmP[0], 0.5, { blur: 0,  autoAlpha: 1 }, { blur: 10, autoAlpha: 0 }, '<');
		} else {
			tl.to(tm[i],   0.5, { blur: 10, autoAlpha: 0, y: window.innerHeight * - 0.02 }, '+=1');
			tl.to(tmP[i],  0.5, { blur: 10, autoAlpha: 0 }, '<');
		}

		tl.fromTo(tm[i + 1],  0.5, { blur: 10, autoAlpha: 0, y: window.innerHeight * 0.02 }, { blur: 0, autoAlpha: 1, y: '0%' }, '+=0.5');
		tl.fromTo(tmP[i + 1], 0.5, { blur: 10, autoAlpha: 0 }, { blur: 0, autoAlpha: 1 }, '<');

		tl.addLabel(end);

		tl.to('.team_counter_animation', {
				y: () => -teamNum[i + 1].offsetTop,
				duration: () => tl.labels[end] - tl.labels[start]
			}, start);
		}

		tl.to(tm[L - 1],  0.5, { blur: 0, autoAlpha: 1, y: '0%' }, '+=1');
		tl.to(tmP[L - 1], 0.5, { blur: 0, autoAlpha: 1          }, '<');


		sections.forEach(function(section, i){

			if( ScrollTrigger.getById('progress-' + i) ) { ScrollTrigger.getById('progress-' + i).kill(true) }

			gsap.timeline({
				scrollTrigger: {
					id: 'progress-' + i,
					invalidateOnRefresh: true,
					trigger: section,
					start: '0% 100%',
					end: '100% 100%',
					scrub: true
				},
				defaults:{ ease:'none' }
			})

			.to(p, { v: parseFloat(section.dataset.end) || 0, onUpdate: setBar, startAt: { v: () => p.v }, }, 0);

		})

	}

	window.addEventListener('resize', resize)

	build()

	playCase(curCase, false)

}

function blur(){

	let blurProperty = gsap.utils.checkPrefix("filter"),
		blurExp = /blur\((.+)?px\)/,
		getBlurMatch = target => (gsap.getProperty(target, blurProperty) || "").match(blurExp) || []

	gsap.registerPlugin({
		name: "blur",
		get(target) {
			return +(getBlurMatch(target)[1]) || 0
		},
		init(target, endValue) {
			let data = this,
				filter = gsap.getProperty(target, blurProperty),
				endBlur = "blur(" + endValue + "px)",
				match = getBlurMatch(target)[0],
				index
			if (filter === "none") {
				filter = ""
			}
			if (match) {
				index = filter.indexOf(match);
				endValue = filter.substr(0, index) + endBlur + filter.substr(index + match.length)
			} else {
				endValue = filter + endBlur
				filter += filter ? " blur(0px)" : "blur(0px)"
			}
			data.target = target 
			data.interp = gsap.utils.interpolate(filter, endValue) 
		},
		render(progress, data) {
			data.target.style[blurProperty] = data.interp(progress)
		}
	})

}

// Direct Load Images
function appendImgs(){

	let appendBGs = document.querySelectorAll('.load_bg'),
		iMGs = document.querySelectorAll('.load_img'),
		loadVideos = document.querySelectorAll('.load_video')

	loadVideos.forEach((wrap) => {

		const src = wrap.dataset.src;
		const v = document.createElement('video');

		v.muted = true;
		v.setAttribute('muted', '')
		v.playsInline = true
		v.setAttribute('playsinline', '')
		v.setAttribute('webkit-playsinline', '')
		v.autoplay = true
		v.setAttribute('autoplay', '')
		v.loop = true
		v.controls = false
		v.preload = 'auto'

		v.src = src

		wrap.appendChild(v)

		v.load()

		const tryPlay = () => v.play().catch(() => {/* swallow */})

		v.addEventListener('loadedmetadata', tryPlay, { once: true })

		tryPlay()

		const resumeOnGesture = () => {
			v.play().finally(() => {
				window.removeEventListener('touchstart', resumeOnGesture, true)
				window.removeEventListener('click', resumeOnGesture, true)
			})
		}
		window.addEventListener('touchstart', resumeOnGesture, true)
		window.addEventListener('click', resumeOnGesture, true)

	})

	iMGs.forEach(function(el, i){

		let s = el.dataset.src

		// el.removeAttribute('data-src')
		el.setAttribute("src", s)
		el.classList.remove('load_img')

		let newImg = new Image

		newImg.onload = function() {

			if(i == iMGs.length - 1) {

				ScrollTrigger.refresh()

			}

		}

		newImg.src = s

	})

	appendBGs.forEach(function(el){

		let s = el.dataset.src

		if(s) {

			el.style.backgroundImage = 'url('+ s +')'
			el.removeAttribute('data-src')
			el.classList.remove('load_img')

		}

	})

}

class WavyProgressBar {
  constructor(canvas, {
    height = 20,
    lineWidth = 2,
    baseColor = 'rgba(255,255,255,0.5)', // background track
    progressColor = '#ffffff',           // solid progress + tip
    tipLength = 56,
    amplitude = 6,
    wavelength = 90,
    speed = 0.02,
    shadowBlur = 0,

    // Motion sensing
    velWindowMs = 180,                   // smoothing for measured velocity
    velDecayMs  = 260,                   // NEW: passive decay when no updates
    velToWave   = v => Math.min(1, v * 18),
    ampEaseMs   = 220,
    minTipPx    = 0.75
  } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cfg = { height, lineWidth, baseColor, progressColor, tipLength, amplitude, wavelength, speed, shadowBlur,
                 velWindowMs, velDecayMs, velToWave, ampEaseMs, minTipPx };

    this.progress = 0;
    this.phase = 0;
    this.playing = true;

    this._vel = 0;           // smoothed progress/sec
    this._ampScale = 0;      // 0..1 (wave strength)
    this._lastSetAt = performance.now();
    this._lastProg = 0;
    this._last = performance.now();
    this._needsRedraw = true;
    this.rafId = null;

    this._onResize = this.size.bind(this);
    window.addEventListener('resize', this._onResize, { passive: true });
    this.size();
    this._ensureRAF();
  }

  size() {
    const { canvas, ctx, cfg } = this;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = (canvas.parentElement || canvas).getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(cfg.height, canvas.clientHeight || cfg.height);

    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = cfg.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = cfg.shadowBlur;
    ctx.shadowColor = cfg.progressColor + 'AA';

    this._needsRedraw = true;
    this._ensureRAF();
  }

  set(v) {
    const nv = Math.max(0, Math.min(1, +v || 0));
    if (nv !== this.progress) {
      const now = performance.now();
      const dt = Math.max(1, now - this._lastSetAt);
      const instVel = Math.abs(nv - this._lastProg) * 1000 / dt;  // progress/sec

      // low-pass incoming velocity sample
      const a = Math.exp(-dt / (this.cfg.velWindowMs || 1));
      this._vel = a * this._vel + (1 - a) * instVel;

      this.progress = nv;
      this._lastProg = nv;
      this._lastSetAt = now;
      this._needsRedraw = true;
      this._ensureRAF();
    }
  }

  play(){ if(!this.playing){ this.playing = true; this._ensureRAF(); } }
  pause(){ if( this.playing){ this.playing = false; this._ensureRAF(); } }
  destroy(){ window.removeEventListener('resize', this._onResize); if (this.rafId) cancelAnimationFrame(this.rafId); }

  _ensureRAF(){ if (!this.rafId) this.rafId = requestAnimationFrame(this._tick.bind(this)); }

  _tick(now) {
    const { canvas, ctx, cfg } = this;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const dt = Math.min(50, now - this._last);
    this._last = now;

    // phase advance
    if (this.playing) this.phase += cfg.speed * dt;

    // —— passive velocity decay so wave dies even without new .set() calls
    const decay = Math.exp(-dt / (cfg.velDecayMs || 1));
    this._vel *= decay;

    // map velocity -> target amplitude scale and ease
    const targetScale = cfg.velToWave(this._vel); // 0..1
    const k = Math.exp(-dt / (cfg.ampEaseMs || 1));
    this._ampScale = targetScale + (this._ampScale - targetScale) * k;

    if (this._needsRedraw || this._ampScale > 0.001 || this.playing) {
      this._needsRedraw = false;

      ctx.clearRect(0, 0, w, h);

      const endX = this.progress * w;
      const midY = h / 2;
      const kWave = (Math.PI * 2) / cfg.wavelength;

      // tip width tapers slightly when wave is tiny
      const tipRaw = Math.min(cfg.tipLength, endX);
      const effectiveTip = tipRaw * (0.8 + 0.2 * this._ampScale);
      const drawTip = effectiveTip > cfg.minTipPx;
      const straightEnd = drawTip ? (endX - effectiveTip) : endX;

      // —— draw BACKGROUND that MOVES WITH PROGRESS: endX → w
      // draw first (butt cap) so the solid sits cleanly on top
      if (endX < w - 0.5) {
        ctx.save();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = cfg.baseColor;
        ctx.beginPath();
        ctx.moveTo(endX, midY);
        ctx.lineTo(w, midY);
        ctx.stroke();
        ctx.restore();
      }

      // —— draw SOLID straight segment: 0 → straightEnd
      if (straightEnd > 0.5) {
        ctx.strokeStyle = cfg.progressColor;
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(straightEnd, midY);
        ctx.stroke();
      }

      // —— draw WAVY tip only while moving
      if (drawTip && this._ampScale > 0.001) {
        const localStart = straightEnd;
        const localTip = effectiveTip;
        const hann = (t) => 0.5 - 0.5 * Math.cos(2 * Math.PI * t); // 0→1→0

        ctx.strokeStyle = cfg.progressColor;
        ctx.beginPath();
        const step = 2;
        for (let x = localStart; x <= endX; x += step) {
          const t = Math.max(0, Math.min(1, (x - localStart) / (localTip || 1)));
          const fade = hann(t) * this._ampScale;
          const y = midY + Math.sin(x * kWave + this.phase) * cfg.amplitude * fade;
          x === localStart ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.lineTo(endX, midY); // exact end on midline
        ctx.stroke();
      } else {
        // ensure no tiny gap when tip is too small or wave is gone
        if (endX > straightEnd + 0.5) {
          ctx.strokeStyle = cfg.progressColor;
          ctx.beginPath();
          ctx.moveTo(straightEnd, midY);
          ctx.lineTo(endX, midY);
          ctx.stroke();
        }
      }
    }

    // keep animating while needed
    if (this.playing || this._ampScale > 0.001) {
      this.rafId = requestAnimationFrame(this._tick.bind(this));
    } else {
      this.rafId = null;
    }
  }
}

// Magnet
class MagnetClass {

	constructor(selector) {

		this.selector = selector

		this.init()

	}

	init() {

		if (!isTouch) 

		this.selector.forEach((el) => {

			document.addEventListener('mousemove', (e) => {

				this.magnetize(el, e)

			})

		})

	}

	magnetize(el, e) {
		const getx = e.pageX
		const getY = e.pageY - window.pageYOffset
		const item = el
		const customDist = item.dataset.dist * 20 || 120
		const bounding = item.getBoundingClientRect()
		const centerX = bounding.left + bounding.width / 2
		const centerY = bounding.top + bounding.height / 2
		let deltaX = Math.floor((centerX - getx)) * -0.6
		let deltaY = Math.floor((centerY - getY)) * -0.6
		const distance = this.calculateDistance(item, getx, getY)

		if (customDist === 0) {
			deltaX = 0
			deltaY = 0
		}

		if (distance < customDist) {

			if (item.classList.contains('magnet')) {
				gsap.to(item, 0.5, { y: deltaY, x: deltaX, ease: 'none' })
				item.classList.add('mg')
			}

		} else {
			gsap.to(item, 0.5, { y: 0, x: 0, ease: 'none' })
			item.classList.remove('mg')
		}
	}

	calculateDistance(elem, mouseX, mouseY) {
		const bounding = elem.getBoundingClientRect()
		return Math.floor(
			Math.sqrt(
				Math.pow(mouseX - (bounding.left + bounding.width / 2), 2) + Math.pow(mouseY - (bounding.top + bounding.height / 2), 2)
			)
		)
	}

	lerp(a, b, n) {
		return (1 - n) * a + n * b
	}

}

// Interactive Labels
class InteractiveLabelsClass {

	constructor(selector) {

		this.selector = selector

		if (!isTouch) { this.init() }

	}

	init() {

		this.selector.forEach((element) => {

			const tl = gsap.timeline({ paused: true })
			const ele = element.querySelector('._txt')
			const ele2 = element.querySelector('._shape')

			let staggerVal, split1, split2

			if(ele && ele.length != 0) {

				if (!ele.classList.contains('words') ) {

					split1 = new SplitText(ele, { type: 'chars', charsClass: 'SplitClass' })
					split2 = split1.chars
					staggerVal = 0.03

				} else {

					split1 = new SplitText(ele, { type: 'words', wordsClass: 'SplitClass' })
					split2 = split1.words
					staggerVal = 0.1

				}

				tl.to([split2, ele2], 0.25, { y: '-50%', autoAlpha: 0, ease: 'power3.in', stagger: 0.05 }, 0)

				.set([split2, ele2], { y: '50%' })

				.to([split2, ele2], 0.25, { y: '0%', autoAlpha: 1, ease: 'power3.out', stagger: 0.05 })

			} else {

				tl.to(ele2, 0.25, { y: '-50%', autoAlpha: 0, ease: 'power3.in', stagger: 0.05 }, 0)

				.set(ele2, { y: '50%' })

				.to(ele2, 0.25, { y: '0%', autoAlpha: 1, ease: 'power3.out', stagger: 0.05 })

			}

			if(ele || ele2) {

				element.animation = tl

				element.addEventListener('mouseenter', () => {

					if (!element.animation.isActive()) {

						element.animation.restart()

					}

				})

			}

		})

	}

}