import "./loader.css";
import React, { useEffect, useState, useCallback, useRef } from "react";

interface LoaderProps {
    message?: string; 
  }
  
  export const Loader: React.FC<LoaderProps> = ({ message }) => {
  const [loaderMessage, setLoaderMessage] = useState("");

  useEffect(() => {
    setLoaderMessage(message ?? '');
  }, [message]);

  return (
    <div className="loader-wrapper">
      <div className="loader-container">
        <div className="loader"></div>
        <span className="loaderText text-center mt-5 mx-3">{loaderMessage}</span>
      </div>
    </div>
  );
};
