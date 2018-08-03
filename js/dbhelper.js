const _DB_VER = 1,
  _DB_NAME = 'rr_db',
  _DB_OBJECT_RESTAURANT = 'restaurants',
  _DB_OBJECT_REVIEW = 'reviews',
  _DB_OBJECT_REVIEW_PENDING = 'rps',
  _DB_OBJECT_FAV_PENDING = 'fps';

let idCount = 0

/**
 * Common database helper functions.
 */
class DBHelper {

  constructor() {
    console.log('db Boot');
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    // const location = window.location.origin;
    // const port = 8000 // Change this to your server port
    return `http://localhost:1337`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants`)
      .then(res => res.json())
      .then(restaurants => {
        callback(null, restaurants)
        // add restaurants to db
        this.openIdbInstance(_DB_OBJECT_RESTAURANT)
          .then(
            db => {
              if (!db) return;
              else {
                const tx = db.transaction(_DB_OBJECT_RESTAURANT, 'readwrite');
                const objectStore = tx.objectStore(_DB_OBJECT_RESTAURANT);
                restaurants.map(restaurant => {
                  objectStore.put(restaurant)
                });
              }
            }
          )
          .catch(err => {
            // possibaly wont exist but curious if it does!
            console.log(err);
          })
      })
      .catch(err => {
        this.openIdbInstance(_DB_OBJECT_RESTAURANT)
          .then(
            db => {
              if (!db) callback(err, null);
              else {
                db.transaction(_DB_OBJECT_RESTAURANT)
                  .objectStore(_DB_OBJECT_RESTAURANT)
                  .index('number')
                  .getAll()
                  .then(restaurants => {
                    callback(null, restaurants);
                  })
                  .catch(err => {
                    callback(err, null);
                  });
              }
            }
          )
      })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
      .then(res => res.json())
      .then(res => {
        if (res instanceof Object) {
          callback(null, res)
        } else {
          callback('Restaurant does not exist', null);
        }
      })
      .catch(err => {
        this.openIdbInstance(_DB_OBJECT_RESTAURANT)
          .then(
            db => {
              if (!db) callback(err, null);
              else {
                db.transaction(_DB_OBJECT_RESTAURANT)
                  .objectStore(_DB_OBJECT_RESTAURANT)
                  .index('number')
                  .get(parseInt(id))
                  .then(restaurant => {
                    console.log(restaurant);
                    callback(null, restaurant);
                  })
                  .catch(err => {
                    callback(err, null);
                  });
              }
            }
          )
      })
  }

  /**
   * fetch restaurant review by id 
   */
  static fetchRestaurantReview(id, callback) {
    fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
      .then(res => res.json())
      .then(reviews => {
        if (reviews instanceof Object) {
          callback(null, reviews)
          this.openIdbInstance(_DB_OBJECT_REVIEW)
            .then(
              db => {
                if (!db) return;
                else {
                  const tx = db.transaction(_DB_OBJECT_REVIEW, 'readwrite');
                  const objectStore = tx.objectStore(_DB_OBJECT_REVIEW);
                  reviews.map(review => {
                    objectStore.put(review)
                  });
                }
              }
            )
            .catch(err => {
              // possibaly wont exist but curious if it does!
              console.log(err);
            })
        } else {
          callback('Restaurant does not exist', null);
        }
      })
      .catch(err => {
        this.openIdbInstance(_DB_OBJECT_REVIEW)
          .then(
            db => {
              if (!db) callback(err, null);
              else {
                db.transaction(_DB_OBJECT_REVIEW)
                  .objectStore(_DB_OBJECT_REVIEW)
                  .index('number')
                  .getAll()
                  .then(reviews => {
                    callback(null, reviews.filter(review => review.restaurant_id === id));
                  })
                  .catch(err => {
                    callback(err, null);
                  });
              }
            }
          )
      })
  }

  /**
   * post a resaurant review, if no connection, 
   * add it to db and sync it later
   */
  static postRestaurantReview(reviewObj, cb, dontAddToDb) {
    return fetch(`${DBHelper.DATABASE_URL}/reviews/`, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify(reviewObj)
      })
      .then(res => res.json())
      .then(reviews => cb(null, reviews))
      .catch(err => {
        if(dontAddToDb) {
          cb(err, null);
          return;
        }
        this.openIdbInstance(_DB_OBJECT_REVIEW_PENDING, true)
          .then(
            db => {
              if (!db) callback(err, null);
              else {
                if (!db) return;
                else {
                  const tx = db.transaction(_DB_OBJECT_REVIEW_PENDING, 'readwrite');
                  const objectStore = tx.objectStore(_DB_OBJECT_REVIEW_PENDING);
                  reviewObj.id = idCount++;
                  objectStore.put(reviewObj);
                }
              }
            }
          )
        cb(err, null)
      })
  }

  /**
   * toggle favt restaurant
   */
  static favtToggleTo(id, truth, cb, dontAddToDb) {
    return fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=${truth}`, {
        method: 'PUT'
      })
      .then(res => res.json())
      .then(restaurant => cb(null, restaurant))
      .catch(error => {
        if(dontAddToDb) {
          cb(err, null);
          return;
        }
        this.openIdbInstance(_DB_OBJECT_FAV_PENDING)
          .then(
            db => {
              if (!db) callback(err, null);
              else {
                if (!db) return;
                else {
                  const tx = db.transaction(_DB_OBJECT_FAV_PENDING, 'readwrite');
                  const objectStore = tx.objectStore(_DB_OBJECT_FAV_PENDING);
                  objectStore.put({
                    id,
                    truth
                  })
                  cb(null, {
                    is_favorite: truth
                  })
                }
              }
            }
          )
        cb(error, null)
      })
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (restaurant.photograph ? `/img/${restaurant.photograph}.webp` : `/img/${restaurant.id}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    })
    marker.addTo(newMap);
    return marker;
  }

  static syncAllFavourites() {
    DBHelper.openIdbFcn(_DB_OBJECT_FAV_PENDING)
      .then(
        db => {
          if (!db) {
            console.log('No Db');
            return;
          } else {
            const tranzaction = db.transaction(_DB_OBJECT_FAV_PENDING)
            const ObjStore = tranzaction.objectStore(_DB_OBJECT_FAV_PENDING).index('number')

            ObjStore
              .getAll()
              .then(favs => {
                favs.map(
                  fav => {
                    DBHelper.favtToggleTo(
                      fav.id,
                      fav.truth,
                      (err, restaurant) => {
                        if (restaurant) {
                          console.log('successfully synced!')
                          DBHelper.deleteOnSunc(_DB_OBJECT_FAV_PENDING, restaurant, 'id')
                        }
                      },
                      true
                    )
                  }
                )
              })
              .catch(err => {
                console.log(err)
              });
          }
        }
      )
  }

  static syncAllReviews() {
    DBHelper.openIdbFcn(_DB_OBJECT_REVIEW_PENDING)
      .then(
        db => {
          if (!db) {
            console.log('No Db');
            return;
          } else {
            const tranzaction = db.transaction(_DB_OBJECT_REVIEW_PENDING)
            const ObjStore = tranzaction.objectStore(_DB_OBJECT_REVIEW_PENDING).index('number')

            ObjStore
              .getAll()
              .then(reviews => {
                reviews.map(
                  review => {
                    const syncReview = {...review};
                    delete(syncReview.id);

                    DBHelper.postRestaurantReview(
                      syncReview,
                      (err, restaurant) => {
                        if (restaurant) {
                          console.log('successfully synced!')
                          DBHelper.deleteOnSunc(_DB_OBJECT_FAV_PENDING, review, 'id')
                        }
                      },
                      true
                    )
                  }
                )
              })
              .catch(err => {
                console.log(err)
              });
          }
        }
      )
  }

  static deleteOnSunc(dbName, delObj, keyPath) {
    DBHelper.openIdbFcn(dbName)
      .then(
        db => {
          if (!db) {
            console.log('No Db');
            return;
          } else {
            const tranzaction = db.transaction(dbName, 'readwrite')
            const ObjStore = tranzaction.objectStore(dbName).index('number')

            ObjStore
              .openCursor()
              .then(function deleteOnSync(cursor) {
                if (!cursor) {
                  return;
                } else {
                  let c_fav = cursor.value
                  if (c_fav.id === delObj[keyPath].toString()) {
                    cursor.delete()
                  }
                  return cursor.continue().then(deleteOnSync);
                }
              })
          }
        })
  }

  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  /**
   * open Instance of Idb
   */
  static openIdbInstance(objectStore) {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return this.openIdbFcn(objectStore)
  }

  static openIdbFcn(objectStore) {
    return idb.open(_DB_NAME + '_' + objectStore, _DB_VER, (upgradeDb) => {
      var store = upgradeDb.createObjectStore(objectStore, {
        keyPath: 'id'
      });
      store.createIndex('number', 'id');
    });
  }
}