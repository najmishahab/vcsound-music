const CATEGORIES = [
    { id: 'liked', name: 'Favorit Saya', bg: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', query: '' },
    { id: 'trending', name: 'Video Trending', bg: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', query: 'populer hits video terbaru' },
    { id: 'pop', name: 'Indo Pop Hits', bg: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', query: 'lagu pop indonesia terbaru hits' },
    { id: 'tiktok', name: 'DJ TikTok Viral', bg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', query: 'dj tiktok viral full bass terbaru' },
    { id: 'koplo', name: 'Dangdut Koplo', bg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', query: 'dangdut koplo terbaru viral' },
    { id: 'remix', name: 'Slow Bass Remix', bg: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', query: 'slow bass remix viral terbaru' },
    { id: 'calm', name: 'Relaksasi & Fokus', bg: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', query: 'lagu santai untuk fokus belajar' },
    { id: 'acoustic', name: 'Akustik Santai', bg: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', query: 'lagu akustik indonesia santai' },
    { id: 'edm', name: 'Electronic Beats', bg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', query: 'electronic dance music hits' },
    { id: 'sholawat', name: 'Sholawat & Religi', bg: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', query: 'sholawat terbaru merdu' }
];

const YOUTUBE_API_KEY = 'AIzaSyBoSx_gsaxJOtPBPhWiI9cEyXilwKYHmK8';

/**
 * SaweriaManager handles real-time donation notifications and marquee.
 */
class SaweriaManager {
    constructor() {
        // Stream Key dari dashboard Saweria pengguna
        this.streamKey = '119054db2d9cecb63c76a9992f9fa1d3';

        this.marqueeEl = document.getElementById('saweriaMarquee');
        this.marqueeContentEl = document.getElementById('saweriaMarqueeContent');
        this.leaderboardListEl = document.getElementById('leaderboardList');
        this.toastContainer = document.getElementById('saweriaToastContainer');
        this.statusInfoEl = document.getElementById('systemInfo');
        this.socket = null;
        
        // Versi kode untuk deteksi cache
        this.version = '1.2.5';
        console.log(`SaweriaManager v${this.version} Constructor called.`);
        
        // Ambil riwayat donasi dengan sangat aman
        try {
            const saved = localStorage.getItem('vcmusic_donor_history');
            this.donors = (saved && saved !== 'undefined' && saved !== 'null') ? JSON.parse(saved) : [];
            if (!Array.isArray(this.donors)) this.donors = [];
        } catch (err) {
            console.error("Gagal membaca localStorage:", err);
            this.donors = [];
        }
        
        // Data bawaan jika belum ada riwayat
        if (this.donors.length === 0) {
            this.donors = [
                { name: 'Andi', amount: 'Rp 10.000', msg: 'Semangat terus bang!' },
                { name: 'Budi', amount: 'Rp 50.000', msg: 'Suka banget sama fiturnya' },
                { name: 'Cici', amount: 'Rp 5.000', msg: 'Kopi buat dev ❤️' },
                { name: 'Doni', amount: 'Rp 100.000', msg: 'Gokil aplikasinya' },
                { name: 'Eka', amount: 'Rp 20.000', msg: 'Bantu up!' }
            ];
        }

        // Tampilkan indikator status sistem
        if (this.statusInfoEl) {
            this.statusInfoEl.textContent = `VCMusic Saweria Module v${this.version} - Ready`;
        }
        
        // Render leaderboard segera
        this.renderLeaderboard();
    }

    init() {
        if (!this.marqueeEl) return;
        
        this.renderMarquee();
        this.marqueeEl.classList.remove('hidden');
        
        // Hubungkan ke server Saweria
        this.connectToSaweria();
    }

    connectToSaweria() {
        if (typeof io === 'undefined') {
            console.error("Socket.io library belum terload. Cek index.html!");
            return;
        }

        console.log("Mencoba menghubungkan ke Saweria...");
        
        // Endpoint node Saweria
        this.socket = io('https://node.saweria.co');

        this.socket.on('connect', () => {
            console.log("Terhubung ke node Saweria. Bergabung ke room...");
            this.socket.emit('join-room', { key: this.streamKey });
        });

        // Saweria menggunakan event 'donations' (plural) untuk real-time alert
        this.socket.on('donations', (data) => {
            console.log("Ada donasi masuk!", data);
            
            // Pastikan data diproses baik sebagai objek tunggal maupun array
            const newDonations = Array.isArray(data) ? data : [data];
            
            newDonations.forEach(item => {
                const name = item.name || 'Anonim';
                const amount = 'Rp ' + (item.amount || 0).toLocaleString('id-ID');
                const msg = item.message || 'Baru saja nyawer!';

                // Tampilkan notifikasi toast
                this.displayAlert(name, amount, msg);
                
                // Masukkan ke marquee dan leaderboard
                this.addDonorToHistory({ name, amount, msg });
            });
        });

        this.socket.on('disconnect', () => {
            console.log("Terputus dari Saweria node.");
        });

        this.socket.on('connect_error', (err) => {
            console.error("Gagal konek ke Saweria:", err);
        });
    }

    addDonorToHistory(donor) {
        // Tambahkan ke daftar paling atas
        this.donors.unshift(donor);
        
        // Simpan hanya 15 donasi terakhir agar tidak lemot
        if (this.donors.length > 15) this.donors.pop();
        
        localStorage.setItem('vcmusic_donor_history', JSON.stringify(this.donors));
        this.renderMarquee();
        this.renderLeaderboard();
    }

    renderLeaderboard() {
        if (!this.leaderboardListEl) {
            this.leaderboardListEl = document.getElementById('leaderboardList');
            if (!this.leaderboardListEl) return;
        }
        
        console.log("Rendering leaderboard dengan donor:", this.donors);
        let html = '';
        this.donors.slice(0, 5).forEach((d, i) => {
            const firstChar = (d.name || '?').charAt(0).toUpperCase();
            html += `
                <div class="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 animate-in slide-in-from-right duration-500 delay-${(i + 1) * 100}">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/20">
                        ${firstChar}
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-bold text-white">${d.name}</span>
                            <span class="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">${d.amount}</span>
                        </div>
                        <p class="text-[10px] text-white/50 italic mt-0.5">${d.msg || 'Terima kasih!'}</p>
                    </div>
                </div>
            `;
        });
        
        this.leaderboardListEl.innerHTML = html;
    }

    renderMarquee() {
        if (!this.marqueeContentEl) return;
        
        // Ensure leaderboard is also updated on first render
        this.renderLeaderboard();
        
        let html = '';
        // Gandakan list untuk animasi loop yang mulus
        const displayList = [...this.donors, ...this.donors];
        
        displayList.forEach(d => {
            html += `
                <div class="saweria-item">
                    <span class="mr-1">☕</span>
                    ${d.name} <span>mendukung</span> ${d.amount}
                </div>
            `;
        });
        
        this.marqueeContentEl.innerHTML = html;
        
        // Sesuaikan kecepatan berdasarkan jumlah konten
        const duration = Math.max(displayList.length * 5, 30); 
        this.marqueeContentEl.style.animationDuration = `${duration}s`;
    }

    displayAlert(name, amount, msg) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'saweria-toast';
        toast.innerHTML = `
            <div class="saweria-toast-icon">☕</div>
            <div class="saweria-toast-body">
                <div class="saweria-toast-name">${name}</div>
                <div class="saweria-toast-msg">${msg || 'Baru saja nyawer!'}</div>
            </div>
            <div class="saweria-toast-amount">${amount}</div>
        `;

        this.toastContainer.appendChild(toast);

        // Munculkan
        setTimeout(() => toast.classList.add('show'), 100);

        // Hilangkan setelah 10 detik (lebih lama untuk donasi asli)
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 600);
        }, 10000);
        
        trackEvent('saweria_real_donation', { donor: name, amount: amount });
    }
}

let player;
let isPlayerReady = false;
let currentPlaylist = [];
let currentSongIndex = -1;
let isPlaying = false;
let progressInterval;

// Analytics & Local Logging Helper
function trackEvent(name, params = {}) {
    // Automatically detect platform
    const isNative = window.Capacitor && Capacitor.isNativePlatform();
    const platform = isNative ? 'android_apk' : 'web_pwa';
    
    const enrichedParams = { ...params, platform: platform };

    // Standard GA4 Tracking
    if (typeof gtag === 'function') {
        gtag('event', name, enrichedParams);
        console.log(`[GA4-SENT] ${name}`, enrichedParams);
    } else {
        console.warn(`[GA4-FAILED] gtag is not defined. Event ${name} was not sent.`);
    }
    
    // Console log for debugging
    console.log(`[Local-Logged] ${name}`, enrichedParams);

    // Local Logging for admin.html
    try {
        const log = JSON.parse(localStorage.getItem('vcmusic_event_log') || '[]');
        log.unshift({
            timestamp: new Date().toISOString(),
            event: name,
            data: enrichedParams
        });
        // Keep last 50 events
        if (log.length > 50) log.pop();
        localStorage.setItem('vcmusic_event_log', JSON.stringify(log));
    } catch (e) {
        console.error("Local log error", e);
    }
}

// Quota Tracking Helper
function updateQuotaUsage(units = 1) {
    const today = new Date().toISOString().split('T')[0];
    let quotaData = JSON.parse(localStorage.getItem('vcmusic_quota_stats') || '{}');
    
    if (quotaData.date !== today) {
        quotaData = { date: today, units: 0 };
    }
    
    quotaData.units += units;
    localStorage.setItem('vcmusic_quota_stats', JSON.stringify(quotaData));
    console.log(`[Quota] Used today: ${quotaData.units} units`);
}


// Initialize YouTube API manually or via callback
function onYouTubeIframeAPIReady() {
    player = new YT.Player('ytplayer', {
        height: '150',
        width: '250',
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1,
            'rel': 0,
            'fs': 0,
            'modestbranding': 1,
            'origin': window.location.origin,
            'autoplay': 1,
            'iv_load_policy': 3
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    isPlayerReady = true;
    console.log("YouTube Player is ready");
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        updatePlayPauseUI();
        startProgressBar();
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        isPlaying = false;
        updatePlayPauseUI();
        stopProgressBar();
        
        if (event.data === YT.PlayerState.ENDED) {
            playNext();
        }
    }
}

function onPlayerError(event) {
    console.error("YT Player Error:", event.data);
    // Skip to next automatically on error (e.g. video unavailable/copyright blocked)
    setTimeout(playNext, 1000);
}

// Placeholder for native ads initialization
async function initNativeAds() {
    console.log("Initializing Native Ads (Placeholder)...");
}

// UI Initialization
document.addEventListener("DOMContentLoaded", async () => {
    if (window.Capacitor && Capacitor.isNativePlatform()) {
        await initNativeAds();
    }
    
    renderCategories();
    setupEventListeners();
    checkIosInstallation();
    
    // Default Empty State
    document.getElementById('songsList').innerHTML = '<div class="text-center text-white/50 py-10 text-sm">Pilih kategori di atas untuk memuat lagu...</div>';

    // Initialize Saweria Notifications
    window.saweriaManager = new SaweriaManager();
    window.saweriaManager.init();
    console.log("Saweria Manager Initialized & Ready");
});

    /* 
    try {
        const { AdMob } = Capacitor.Plugins;
        const { BackgroundMode } = Capacitor.Plugins;
        
        if (BackgroundMode) {
            await BackgroundMode.enable();
        }

        await AdMob.initialize({ requestTrackingAuthorization: true });
        showNativeBanner();
    } catch (e) {
        console.error("AdMob Init Error:", e);
    }
    */
    console.log("APK Mode: AdMob disabled for safety. Relying on Web Ads.");

async function showNativeBanner() {
    try {
        const { AdMob } = Capacitor.Plugins;
        await AdMob.showBanner({
            adId: 'ca-app-pub-9637882161685177/9269725861', // Real Banner ID
            position: 'BOTTOM_CENTER',
            size: 'BANNER',
            margin: 0,
            isTesting: false
        });
        // Hide AdSense banners if native
        const adsenseBanners = document.querySelectorAll('.adsbygoogle');
        adsenseBanners.forEach(el => el.style.display = 'none');
    } catch (e) {
        console.error("Banner Ad Error:", e);
    }
}

function checkIosInstallation() {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true;
    
    if (isIos && !isStandalone) {
        // Show install button for iOS as well, but it opens the guide
        document.getElementById('installPwaBtn').classList.remove('hidden');
        
        // Show modal after 3 seconds to not overwhelm
        setTimeout(() => {
            document.getElementById('iosInstallModal').classList.remove('hidden');
            document.getElementById('iosInstallModal').classList.add('flex');
        }, 3000);
    }
}

function renderCategories() {
    const grid = document.getElementById('categoryGrid');
    CATEGORIES.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.backgroundImage = `url(${cat.bg})`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
        
        card.innerHTML = `
            <div class="card-content">
                <h3 class="font-bold text-white shadow-sm text-sm sm:text-base">${cat.name}</h3>
            </div>
        `;
        
        card.addEventListener('click', async () => {
            // Update title for SEO
            document.title = `VCMusic - ${cat.name}`;
            
            // Trick browser auto-play policy by initializing media synchronously on click
            if (isPlayerReady && player && player.playVideo) {
                player.playVideo();
                player.pauseVideo();
            }

            if (cat.id === 'liked') {
                loadLikedSongs();
                return;
            }

            showInterstitial();
            // Panggil API secara langsung (tanpa setTimeout)
            await fetchRealSongs(cat.id);
        });
        
        grid.appendChild(card);
    });
}

function fetchMockSongs(catId) {
    const defaultIds = ['dQw4w9WgXcQ', 'jNQXAC9IVRw', '9bZkp7q19f0', '2ZIpFytCSVc', 'kJQP7kiw5Fk'];
    const cat = CATEGORIES.find(c => c.id === catId);
    
    const newSongs = Array.from({length: 10}).map((_, i) => ({
        id: defaultIds[i % defaultIds.length],
        title: `${cat.name} Mix Track ${i+1} Viral Version`,
        artist: `DJ ${cat.name.split(' ')[0]} ${i+1}`,
        duration: 200 + i * 10,
        thumbnail: cat.bg
    }));
    
    document.getElementById('musicTransition').classList.add('hidden');
    document.getElementById('musicTransition').classList.remove('flex');
    setPlaylist(newSongs);
    
    // Auto play first song
    if (newSongs.length > 0) {
        playSong(0);
    }
}

async function fetchRealSongs(catId) {
    if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
        console.warn("YouTube API Key is missing. Falling back to mock data.");
        fetchMockSongs(catId);
        return;
    }
    
    const cat = CATEGORIES.find(c => c.id === catId);
    
    try {
        updateQuotaUsage(100); // Search costs 100 units
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=${encodeURIComponent(cat.query)}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`);
        
        // Track Search Action for Quota Monitoring
        trackEvent('youtube_search', { category: cat.id, query: cat.query });
        
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const newSongs = data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                artist: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.high.url
            }));
            
            // Do NOT hide the ad immediately. Let the interstitial logic handle it.
            setPlaylist(newSongs);
            
            if (newSongs.length > 0) {
                playSong(0);
            }
        } else {
            console.warn("No results from YouTube API, falling back to mock.");
            fetchMockSongs(catId);
        }
    } catch (err) {
        console.error("YouTube Fetch Error", err);
        fetchMockSongs(catId);
    }
}

function setPlaylist(songs) {
    currentPlaylist = songs;
    renderSongs();
}

function renderSongs() {
    const list = document.getElementById('songsList');
    list.innerHTML = '';
    
    const likedSongs = JSON.parse(localStorage.getItem('vc_liked_data') || '[]');
    
    currentPlaylist.forEach((song, idx) => {
        const item = document.createElement('div');
        item.className = `song-item group ${idx === currentSongIndex ? 'active' : ''}`;
        
        let indicator = `<div class="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-xs opacity-50">${idx+1}</div>`;
        if (idx === currentSongIndex && isPlaying) {
            indicator = `
                <div class="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                    <div class="playing-bars">
                        <div class="bar"></div><div class="bar"></div><div class="bar"></div>
                    </div>
                </div>`;
        } else if (idx === currentSongIndex) {
            indicator = `<div class="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0 text-[#06b6d4]">▶</div>`;
        }
        
        const isFav = likedSongs.some(s => s.id === song.id);
        
        item.innerHTML = `
            ${indicator}
            <div class="w-10 h-10 rounded bg-cover bg-center shrink-0 shadow-sm" style="background-image: url(${song.thumbnail})"></div>
            <div class="flex-1 overflow-hidden">
                <h4 class="font-medium text-sm truncate ${idx === currentSongIndex ? 'text-[#06b6d4]' : 'text-white'}">${song.title}</h4>
                <p class="text-xs text-white/50 truncate mt-0.5">${song.artist}</p>
            </div>
            <button class="list-like-btn p-3 transition-all ${isFav ? 'text-pink-500' : 'text-white/20 group-hover:text-white/40'}" data-idx="${idx}">
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
        `;
        
        item.addEventListener('click', (e) => {
           if (!e.target.closest('.list-like-btn')) {
               playSong(idx);
           }
        });

        item.querySelector('.list-like-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(song);
        });

        list.appendChild(item);
    });
}

function playSong(index) {
    if (index < 0 || index >= currentPlaylist.length) return;
    
    currentSongIndex = index;
    const song = currentPlaylist[index];
    
    // Update UI
    document.getElementById('nowPlayingTitle').textContent = song.title;
    document.getElementById('nowPlayingTitle').classList.add('animate-marquee');
    document.getElementById('nowPlayingArtist').textContent = song.artist;
    document.getElementById('nowPlayingArt').style.backgroundImage = `url(${song.thumbnail})`;
    
    updateLikeUI();
    renderSongs(); 
    
    if (isPlayerReady && player && player.loadVideoById) {
        player.loadVideoById(song.id);
        player.playVideo(); // Force play
        updateMediaSession(song);

        // Track Song Playback
        trackEvent('song_play', { 
            song_title: song.title, 
            song_id: song.id,
            category: document.title.replace('VCMusic - ', '')
        });
    } else {
        console.error("Youtube Player is not ready yet!");
    }
}

function updateMediaSession(song) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.artist,
            album: 'VCMusic Viral',
            artwork: [
                { src: song.thumbnail, sizes: '96x96', type: 'image/png' },
                { src: song.thumbnail, sizes: '128x128', type: 'image/png' },
                { src: song.thumbnail, sizes: '192x192', type: 'image/png' },
                { src: song.thumbnail, sizes: '256x256', type: 'image/png' },
                { src: song.thumbnail, sizes: '384x384', type: 'image/png' },
                { src: song.thumbnail, sizes: '512x512', type: 'image/png' },
            ]
        });

        navigator.mediaSession.setActionHandler('play', () => { player.playVideo(); });
        navigator.mediaSession.setActionHandler('pause', () => { player.pauseVideo(); });
        navigator.mediaSession.setActionHandler('previoustrack', () => { playPrev(); });
        navigator.mediaSession.setActionHandler('nexttrack', () => { playNext(); });
    }
}

function toggleLike(targetSong = null) {
    const song = targetSong || (currentSongIndex !== -1 ? currentPlaylist[currentSongIndex] : null);
    if (!song) return;
    
    const songId = song.id;
    let likedSongs = JSON.parse(localStorage.getItem('vc_liked_data') || '[]');
    
    const exists = likedSongs.findIndex(s => s.id === songId);
    if (exists !== -1) {
        likedSongs.splice(exists, 1);
    } else {
        likedSongs.unshift(song); // Add to top
    }
    
    localStorage.setItem('vc_liked_data', JSON.stringify(likedSongs));
    
    // Update both Footer and List UI
    updateLikeUI();
    
    // If we are currently in the Favorit category, we need to refresh the list 
    // to potentially remove the unliked song
    const currentTitle = document.title;
    if (currentTitle.includes('Favorit Saya')) {
        loadLikedSongs(false); // don't auto-play
    } else {
        renderSongs(); // Just update icons
    }
}

function updateLikeUI() {
    if (currentSongIndex === -1) return;
    const songId = currentPlaylist[currentSongIndex].id;
    const likedSongs = JSON.parse(localStorage.getItem('vc_liked_data') || '[]');
    const likeBtn = document.getElementById('likeBtn');
    
    const isLiked = likedSongs.some(s => s.id === songId);
    if (isLiked) {
        likeBtn.classList.add('text-pink-500');
        likeBtn.classList.remove('text-white/50');
    } else {
        likeBtn.classList.remove('text-pink-500');
        likeBtn.classList.add('text-white/50');
    }
}

function loadLikedSongs(autoPlay = true) {
    const likedSongs = JSON.parse(localStorage.getItem('vc_liked_data') || '[]');
    if (likedSongs.length === 0) {
        document.getElementById('songsList').innerHTML = '<div class="text-center text-white/50 py-10 px-6 text-sm flex flex-col items-center gap-4 animate-in fade-in duration-500"> <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></div> <p>Belum ada lagu favorit.<br>Ketuk ikon hati pada lagu untuk menyimpannya.</p></div>';
        currentPlaylist = [];
        return;
    }
    setPlaylist(likedSongs);
    if (autoPlay && likedSongs.length > 0) playSong(0);
}

function togglePlayPause() {
    if (!isPlayerReady || currentSongIndex === -1) {
        if (currentPlaylist.length > 0) playSong(0);
        return;
    }
    
    if (isPlaying) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function playNext() {
    if (currentSongIndex < currentPlaylist.length - 1) {
        playSong(currentSongIndex + 1);
    } else {
        // Endless Auto-play
        playSong(0); 
    }
}

function playPrev() {
    if (currentSongIndex > 0) {
        playSong(currentSongIndex - 1);
    }
}

function updatePlayPauseUI() {
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    
    if (isPlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }
    renderSongs(); 
}

function startProgressBar() {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        if (isPlayerReady && player && player.getCurrentTime && player.getDuration) {
            const time = player.getCurrentTime();
            const duration = player.getDuration();
            if (duration > 0) {
                const percent = (time / duration) * 100;
                document.getElementById('progressBar').style.width = `${percent}%`;
            }
        }
    }, 500);
}

function stopProgressBar() {
    clearInterval(progressInterval);
}

function setupEventListeners() {
    document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
    document.getElementById('nextBtn').addEventListener('click', playNext);
    document.getElementById('prevBtn').addEventListener('click', playPrev);
    document.getElementById('likeBtn').addEventListener('click', toggleLike);
    
    // Full audio scrubbing (click and drag) support
    const progressBarContainer = document.getElementById('progressBarContainer');
    let isDragging = false;
    
    function updateProgressFromEvent(e) {
        if (isPlayerReady && player && player.getDuration) {
            const rect = progressBarContainer.getBoundingClientRect();
            let clickX = e.clientX - rect.left;
            // Clamp values
            if (clickX < 0) clickX = 0;
            if (clickX > rect.width) clickX = rect.width;
            
            const percentage = clickX / rect.width;
            const duration = player.getDuration();
            
            // Visual update instantly
            document.getElementById('progressBar').style.width = `${percentage * 100}%`;
            // Seek youtube player
            player.seekTo(duration * percentage, true);
        }
    }

    progressBarContainer.addEventListener('pointerdown', (e) => {
        isDragging = true;
        updateProgressFromEvent(e);
        // Prevent accidental text selection while scrubbing
        e.preventDefault();
    });
    
    document.addEventListener('pointermove', (e) => {
        if (isDragging) {
            updateProgressFromEvent(e);
        }
    });
    
    document.addEventListener('pointerup', () => {
        if (isDragging) {
            isDragging = false;
        }
    });

    document.getElementById('shuffleAllBtn').addEventListener('click', async () => {
        if (isPlayerReady && player && player.playVideo) {
            player.playVideo();
            player.pauseVideo();
        }
        await playShuffle();
    });
    
    document.getElementById('closeAdBtn').addEventListener('click', () => {
        document.getElementById('musicTransition').classList.add('hidden');
        document.getElementById('musicTransition').classList.remove('flex');
    });
    
    // PWA Install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installPwaBtn').classList.remove('hidden');
    });

    document.getElementById('installPwaBtn').addEventListener('click', () => {
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIos) {
            // Special handling for iOS: show guide
            const modal = document.getElementById('iosInstallModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else if (deferredPrompt) {
            // Native Android/Chrome prompt
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                deferredPrompt = null;
                document.getElementById('installPwaBtn').classList.add('hidden');
            });
        }
    });

    document.getElementById('downloadApkBtn').addEventListener('click', () => {
        trackEvent('apk_download_click', { source: 'header' });
    });
}

async function showInterstitial() {
    const adContainer = document.getElementById('musicTransition');
    adContainer.classList.remove('opacity-0', 'pointer-events-none');
    adContainer.classList.add('opacity-100', 'pointer-events-auto');
    
    // Auto-hide after 3 seconds (clean loading experience)
    setTimeout(() => {
        adContainer.classList.add('opacity-0', 'pointer-events-none');
        adContainer.classList.remove('opacity-100', 'pointer-events-auto');
    }, 3000);
}

async function playShuffle() {
    showInterstitial();
    
    if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
        setTimeout(() => {
            let allSongs = [];
            const defaultIds = ['dQw4w9WgXcQ', 'jNQXAC9IVRw', '9bZkp7q19f0', '2ZIpFytCSVc', 'kJQP7kiw5Fk'];
            
            CATEGORIES.forEach(cat => {
                const newSongs = Array.from({length: 4}).map((_, i) => ({
                    id: defaultIds[(i + cat.name.length) % defaultIds.length],
                    title: `${cat.name} Mix Track ${i+1}`,
                    artist: `VCMusic DJ`,
                    duration: 200 + i * 15,
                    thumbnail: cat.bg
                }));
                allSongs = allSongs.concat(newSongs);
            });
            
            for (let i = allSongs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
            }
            
            // Let 5s timer handle the ad hiding
            setPlaylist(allSongs);
            
            if (allSongs.length > 0) {
                playSong(0);
            }
        }, 1000);
    } else {
        try {
            updateQuotaUsage(100); // Shuffle Search costs 100 units
            const randomQuery = ['lagu viral tiktok full bass', 'epic cinematic music', 'lofi chill beats ncs'][Math.floor(Math.random() * 3)];
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=${encodeURIComponent(randomQuery)}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`);
            
            // Track Shuffle Search for Quota Monitoring
            trackEvent('youtube_search_shuffle', { query: randomQuery });
            
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                let allSongs = data.items.map(item => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    artist: item.snippet.channelTitle,
                    thumbnail: item.snippet.thumbnails.high.url
                }));
                
                for (let i = allSongs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
                }
                
                // Let 5s timer handle the ad hiding
                setPlaylist(allSongs);
                
                if (allSongs.length > 0) playSong(0);
            } else {
                throw new Error("No items");
            }
        } catch (err) {
            console.error("YouTube Fetch Error on Shuffle", err);
            fetchMockSongs(CATEGORIES[0].id);
        }
    }
}

/**
 * SaweriaManager handles donation notifications and marquee.
 */
