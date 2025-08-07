import React from 'react';
function ProfilePicture({ src, size }) {
    return (
      <div
        className="flex justify-center items-center rounded-full overflow-hidden bg-gray-300"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        <img
          src={src}
          alt="Profile"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    );
}

export default ProfilePicture;
  