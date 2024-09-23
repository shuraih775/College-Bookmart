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
        console.log('Extracted file:', value);  // Log extracted file details
      }
    }

    if (files.length > 0) {
      // Convert File objects to JSON-friendly blobs for storage
      const serializedFiles = files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        blob: file  // Store file object directly
      }));

      // Save the files to IndexedDB and handle errors within saveFilesToIndexedDB
      try {
        await saveFilesToIndexedDB(serializedFiles);
      } catch (dbError) {
        console.error('Database error:', dbError);
        return new Response('Error saving files to IndexedDB', { status: 500 });
      }
    }

    // Redirect to the homepage after successful operation
    return Response.redirect('/', 303);
  } catch (error) {
    console.error('Error handling share target:', error);
    return new Response('Error processing the share target', { status: 500 });
  }
}

// Function to save files to IndexedDB with error handling
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
        console.error('Transaction error:', err);
        reject(new Error('Transaction error while saving files to IndexedDB'));
      };
    };

    request.onerror = (err) => {
      console.error('IndexedDB open error:', err);
      reject(new Error('Error opening IndexedDB'));
    };
  });
}
