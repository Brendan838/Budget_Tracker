var db, budget;

// Create a new db request for a "budget" database.
const request = indexedDB.open('budget', budget || 21);

request.onupgradeneeded = function (e) {

  console.log("this worked!");
  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('budget', { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

function checkDB() {
  console.log('check db invoked');


  let transaction = db.transaction(['budget'], 'readwrite');

  const store = transaction.objectStore('budget');

  const getAll = store.getAll();

 
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // If our returned response is not empty
          if (res.length !== 0) {
            // Open another transaction to budget with the ability to read and write
            transaction = db.transaction(['budget'], 'readwrite');

            const currentStore = transaction.objectStore('budget');

            currentStore.clear();
            console.log('Clearing store 🧹');
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    checkDB();
  }
};

const saveRecord = (record) => {
  console.log('Save record invoked');
  // Create a transaction on the budget db with readwrite access
  const transaction = db.transaction(['budget'], 'readwrite');

  // Access your budget object store
  const store = transaction.objectStore('budget');

  // Add record to your store with add method.
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDB);