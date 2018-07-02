const cachName = 'v1'
const staticAssets = [
	'./',
	'./CurrencyConverter.js',
	'./css/styles.css',
];

self.addEventListener('install', async event => {
	const cache = await caches.open('CurrencyConverter');
	cache.addAll(staticAssets);
});
self.addEventListener('fetch', event => {
	const req = event.request;
	const url = new URL(req.url);

	if(url.origin == location.origin){
		event.respondWith(cacheFirst(req));
	}
	else {
		event.respondWith(networkFirst(req));
	}
});
async function cacheFirst(req){
	const cachedResponse = await caches.match(req);
	return cachedResponse || fetch(req);
}
async function networkFirst(req){
	//go to network, put in cache, if fails return that instead
	const cache = await caches.open('CCDynamic');
	try {
		const res = await fetch(req);
		cache.put(req, res.clone());
		return res;
	}
	catch(error){
		return await(cache.match(req));
	}
}
