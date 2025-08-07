const UploadGuide = () => {
    return (
      <div className="p-5 mx-auto">
        <p className="mb-4">
          Follow these steps to correctly upload your blog post using Google Docs.
        </p>
        
        <h3 className="text-xl font-semibold mt-4">1. Prepare Your Blog Post</h3>
        <p className="mb-2">Log in to Google Drive and create a new Google Doc.</p>
        <p className="mb-4">Write your blog post, including text, tables, and images as needed.</p>
        
        <h3 className="text-xl font-semibold mt-4">2. Download as HTML</h3>
        <p className="mb-2">Once your blog is ready:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Click <strong>File</strong> &gt; <strong>Download</strong> &gt; <strong>Web Page (.html, zipped)</strong>.</li>
          <li>A ZIP file will be downloaded to your computer.</li>
          <li>Extract the ZIP file and keep all files intact (Do not rename anything).</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-4">3. Upload to Blog Manager</h3>
        <p className="mb-2">In the Blog Manager:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Enter the <strong>Title</strong> and <strong>Description</strong> of your blog post.</li>
          <li>Upload a <strong>Thumbnail</strong> (used for blog previews).</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-4">4. Upload the Blog Content</h3>
        <ul className="list-disc list-inside mb-4">
          <li>Upload the <strong>HTML file</strong> from the extracted folder.</li>
          <li>Navigate to the <strong>images</strong> folder inside the extracted folder.</li>
          <li>Select and upload all images from this folder.</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-4">5. Final Step</h3>
        <p className="mb-2">Click <strong>Upload to Cloudflare</strong> to complete the process.</p>
      </div>
    );
  };
  
  export default UploadGuide;
  