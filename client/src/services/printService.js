self.addEventListener('fetch', (event) => {
    if (event.request.method === 'POST' && event.request.url.endsWith('/share-target')) {
      event.respondWith(handleShareTarget(event.request));
    }
  });
  
  async function handleShareTarget(request) {
    const formData = await request.formData();
    const files = [];
  
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
        blob: URL.createObjectURL(file)
      }));
  
      // Store file blobs in localStorage or IndexedDB
      localStorage.setItem('files', JSON.stringify(serializedFiles));
    }
  
    return Response.redirect('/', 303);
  }
  