self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.endsWith('/share-target')) {
    alert("hi")
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

      // Save the files to localStorage
      localStorage.setItem('files', JSON.stringify(serializedFiles));
    }

    // Redirect to the homepage
    return Response.redirect('/', 303);
  } catch (error) {
    console.error('Error handling share target:', error);
    return new Response('Error processing the share target', { status: 500 });
  }
}
