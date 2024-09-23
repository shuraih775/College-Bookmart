self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.endsWith('/share-target')) {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const files = [];

    // Extract the files from the formData
    for (const [name, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    if (files.length > 0) {
      // Convert File objects to JSON-friendly blobs for storage
      const serializedFiles = files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        blob: URL.createObjectURL(file)  // Store as blob URL
      }));

      // Save the files to IndexedDB
      await saveFilesToIndexedDB(serializedFiles);
    }

    // Redirect to the homepage
    return Response.redirect('/', 303);
  } catch (error) {
    console.error('Error handling share target:', error);
    return new Response('Error processing the share target', { status: 500 });
  }
}

// Function to save files to IndexedDB
async function saveFilesToIndexedDB(files) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('fileStorage', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'name' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');

      files.forEach(file => {
        store.put(file);
      });

      transaction.oncomplete = () => {
        console.log('Files saved to IndexedDB');
        resolve();
      };

      transaction.onerror = (err) => {
        console.error('Error saving files to IndexedDB', err);
        reject(err);
      };
    };

    request.onerror = (err) => {
      console.error('IndexedDB error:', err);
      reject(err);
    };
  });
}
