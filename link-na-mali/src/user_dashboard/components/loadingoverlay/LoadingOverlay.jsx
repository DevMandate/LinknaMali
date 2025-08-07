import './LoadingOverlay.css'; 

const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <p>{message}</p>
        <div className="loader"></div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
