import React from "react";

const KnowledgeBase = () => {
  return (
    <>
      <h3 className="text-2xl font-bold mb-6 text-gray-700 text-center mt-4">Knowledge Base</h3>
      <div className="border border-gray-300 rounded-lg bg-white shadow-lg p-6 max-w-lg mx-auto">
        <ul className="divide-y divide-gray-200">
          <li className="py-6">
            <h4 className="text-xl font-semibold mb-3 text-gray-900">How to List Your Property:</h4>
            <p className="text-gray-700 leading-relaxed text-left">
              1. <strong className="text-gray-900">Create an Account:</strong> Sign up on our website.
              <br />
              2. <strong className="text-gray-900">List Your Property:</strong> Provide details, upload images, and set the price.
              <br />
              3. <strong className="text-gray-900">Manage Inquiries:</strong> Respond to tenants and schedule viewings.
            </p>
          </li>
          <li className="py-6">
            <h4 className="text-xl font-semibold mb-3 text-gray-900">Troubleshooting Common Issues:</h4>
            <p className="text-gray-700 leading-relaxed text-left">
              1. <strong className="text-gray-900">Check Your Internet Connection:</strong> Ensure stable connectivity.
              <br />
              2. <strong className="text-gray-900">Clear Browser Cache:</strong> Remove cached files and cookies.
              <br />
              3. <strong className="text-gray-900">Contact Support:</strong> Provide details and screenshots for assistance.
            </p>
          </li>
        </ul>
      </div>
    </>
  );
};

export default KnowledgeBase;