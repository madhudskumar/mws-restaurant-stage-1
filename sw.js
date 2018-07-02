const _CACHE_VER = 4,
    _CACHE_NAME = `rr_${_CACHE_VER}`

const _API_URL = 'http://localhost:1337';

const _ADD_TO_CACHE = [
    './index.html',
    './restaurant.html',
    './css/styles.css',
    './js/dbhelper.js',
    './js/main.js',
    './js/restaurant_info.js'
]

self.addEventListener('install', ($event) => {
    caches.open(_CACHE_NAME)
        .then((cache) => {
            return cache.addAll(_ADD_TO_CACHE)
        })
        .catch((err) => {
            console.log(err)
        })
})

self.addEventListener('fetch', ($event) => {
    const requestUrl = new URL($event.request.url)
    if (requestUrl.origin !== _API_URL) {
        $event
            .respondWith(
                caches
                .match($event.request)
                .then(
                    (response) => {
                        return (
                            response ||
                            (() => {
                                const internetFetchRequest = $event.request.clone()
                                return fetch(internetFetchRequest)
                                    .then(
                                        (response) => {
                                            if (!response || !response.ok) {
                                                return response
                                            } else {
                                                const addToCache = response.clone()
                                                caches.open(_CACHE_NAME)
                                                    .then((cache) => {
                                                        return cache.put($event.request, addToCache)
                                                    })
                                                return response
                                            }
                                        }
                                    )
                                    .catch((err) => {
                                        console.log(err)
                                    })
                            })()
                        )

                    })
            )
    }
})