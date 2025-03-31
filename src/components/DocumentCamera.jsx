// src/components/DocumentCamera.jsx
import React, { useState, useRef, useEffect } from "react";
import "../styles/DocumentCamera.css";

const DocumentCamera = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const cropAreaRef = useRef(null);

  // התחלת המצלמה
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // מצלמה אחורית
          width: { ideal: window.innerWidth },
          height: { ideal: window.innerHeight },
        },
      });

      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("לא ניתן לגשת למצלמה. אנא ודא כי הינך מאשר גישה למצלמה.");
    }
  };

  // יצירת מסגרת הגדרת שטח הצילום
  useEffect(() => {
    if (videoRef.current && videoRef.current.videoWidth) {
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;

      // התחלת המסגרת עם מידות ברירת מחדל
      setCropArea({
        x: videoWidth * 0.1,
        y: videoHeight * 0.1,
        width: videoWidth * 0.8,
        height: videoHeight * 0.8,
      });
    }
  }, [stream]);

  // צילום תמונה
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // התאמת גודל הקנבס לגודל הוידאו
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");

      // צייר את התמונה
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // חתוך את האזור המסומן
      const imageData = ctx.getImageData(
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height
      );

      // יצירת קנבס חדש בגודל האזור החתוך
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = cropArea.width;
      croppedCanvas.height = cropArea.height;
      const croppedCtx = croppedCanvas.getContext("2d");
      croppedCtx.putImageData(imageData, 0, 0);

      // המרה לתמונה
      const capturedImage = croppedCanvas.toDataURL("image/jpeg", 0.9);

      if (isMultipleMode) {
        setCapturedImages([...capturedImages, capturedImage]);
      } else {
        setCurrentImage(capturedImage);
        setShowPreview(true);
      }
    }
  };

  // אישור התמונה במצב יחיד
  const confirmImage = () => {
    if (currentImage) {
      if (isMultipleMode) {
        // במצב מרובה, שמור את כל התמונות
        mergeImages(capturedImages).then((mergedImage) => {
          onCapture(dataURLtoFile(mergedImage, "document.jpg"));
          onClose();
        });
      } else {
        // במצב יחיד, שמור את התמונה הנוכחית
        onCapture(dataURLtoFile(currentImage, "document.jpg"));
        onClose();
      }
    }
  };

  // המרת dataURL לקובץ
  const dataURLtoFile = (dataURL, filename) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  // מיזוג מספר תמונות לתמונה אחת ארוכה
  const mergeImages = async (images) => {
    if (!images.length) return null;

    // יצירת תמונות מ-dataURL
    const loadedImages = await Promise.all(
      images.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = src;
        });
      })
    );

    // חישוב הגובה הכולל
    const totalHeight = loadedImages.reduce(
      (height, img) => height + img.height,
      0
    );
    const width = loadedImages[0].width;

    // יצירת קנבס גדול
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = totalHeight;
    const ctx = canvas.getContext("2d");

    // ציור כל התמונות בזו אחר זו
    let y = 0;
    loadedImages.forEach((img) => {
      ctx.drawImage(img, 0, y, width, img.height);
      y += img.height;
    });

    return canvas.toDataURL("image/jpeg", 0.9);
  };

  // הוספת תמונה נוספת במצב מרובה
  const addAnotherImage = () => {
    setShowPreview(false);
    setCurrentImage(null);
  };

  // סיום ומיזוג במצב מרובה
  const finishMultipleCapture = () => {
    if (capturedImages.length > 0) {
      mergeImages(capturedImages).then((mergedImage) => {
        setCurrentImage(mergedImage);
        setShowPreview(true);
      });
    } else {
      alert("לא צולמו תמונות עדיין");
    }
  };

  // מיקום המסגרת הירוקה של שטח הצילום
  const handleCropAreaDrag = (e) => {
    if (!cropAreaRef.current) return;

    const rect = cropAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // עדכון מיקום המסגרת
    setCropArea((prevCrop) => ({
      ...prevCrop,
      x: x - prevCrop.width / 2,
      y: y - prevCrop.height / 2,
    }));
  };

  return (
    <div className="document-camera-container">
      {!showPreview ? (
        // תצוגת מצלמה
        <div className="camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="camera-preview"
            onLoadedMetadata={() => {
              // התאמת הגודל כשהוידאו נטען
              if (videoRef.current) {
                const { videoWidth, videoHeight } = videoRef.current;
                setCropArea({
                  x: videoWidth * 0.1,
                  y: videoHeight * 0.1,
                  width: videoWidth * 0.8,
                  height: videoHeight * 0.8,
                });
              }
            }}
          />

          {/* מסגרת ירוקה לשטח צילום */}
          <div
            ref={cropAreaRef}
            className="crop-area"
            style={{
              position: "absolute",
              top: `${cropArea.y}px`,
              left: `${cropArea.x}px`,
              width: `${cropArea.width}px`,
              height: `${cropArea.height}px`,
              border: "2px dashed #4CAF50",
              cursor: "move",
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              handleCropAreaDrag({
                clientX: touch.clientX,
                clientY: touch.clientY,
              });
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              // אפשר גרירה של המסגרת
              document.onmousemove = handleCropAreaDrag;
              document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
              };
            }}
          />

          <div className="camera-controls">
            <div className="mode-selector">
              <button
                className={isMultipleMode ? "" : "active"}
                onClick={() => setIsMultipleMode(false)}
              >
                מסמך יחיד
              </button>
              <button
                className={isMultipleMode ? "active" : ""}
                onClick={() => setIsMultipleMode(true)}
              >
                מספר מסמכים
              </button>
            </div>

            <button className="capture-button" onClick={captureImage}>
              צלם
            </button>

            {isMultipleMode && capturedImages.length > 0 && (
              <div className="multiple-capture-info">
                {capturedImages.length} תמונות צולמו
                <button onClick={finishMultipleCapture}>סיים ומזג</button>
              </div>
            )}

            <button className="close-button" onClick={onClose}>
              סגור
            </button>
          </div>
        </div>
      ) : (
        // תצוגת תצוגה מקדימה
        <div className="preview-view">
          <h3>תצוגה מקדימה של המסמך</h3>
          <div className="image-preview">
            <img src={currentImage} alt="מסמך שצולם" />
          </div>

          <div className="preview-controls">
            {isMultipleMode ? (
              <>
                <button onClick={addAnotherImage}>הוסף תמונה נוספת</button>
                <button onClick={confirmImage}>אשר ושמור</button>
              </>
            ) : (
              <>
                <button onClick={confirmImage}>אשר</button>
                <button onClick={() => setShowPreview(false)}>צלם שוב</button>
              </>
            )}
            <button onClick={onClose}>בטל</button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default DocumentCamera;
