const _VER = 2,
    _CACHE_NAME = `rr_${_VER}`;


const _ADD_TO_CACHE = [
    './index.html',
    './restaurant.html',
    './css/styles.css',
    './js/dbhelper.js',
    './js/main.js',
    './js/restaurant_info.js'
]


self.addEventListener('install', ($event) => {
    $event
        .waitUntil(
            caches.open(_CACHE_NAME)
            .then((cache) => {
                return cache.addAll(_ADD_TO_CACHE);
            })
        );
})

self.addEventListener('fetch', ($event) => {
    $event
        .respondWith(
            caches
            .match($event.request)
            .then(
                (response) => {
                    return (
                        response 
                        ||
                        (() => {
                            const internetFetchRequest = $event.request.clone();
                            return fetch(internetFetchRequest)
                                .then(
                                    (response) => {
                                        if (!response) {
                                            return response;
                                        }
                                        else {
                                            const addToCache = response.clone();
                                            caches.open(_CACHE_NAME)
                                                .then((cache) => {
                                                    return cache.put($event.request, addToCache);
                                                });
                                            return response;
                                        }
                                    }
                                )
                                .catch((err) => {
                                    console.log(err);
                                });
                        })()
                    )

                })
        );
})