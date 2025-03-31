// src/components/DocumentCamera.jsx - תיקון בעיות תצוגה ושחרור משאבים
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
  const [cameraReady, setCameraReady] = useState(false);

  // התחלת המצלמה
  useEffect(() => {
    const initCamera = async () => {
      try {
        await startCamera();
        // מניעת גלילה בגוף המסמך כשהמצלמה פתוחה
        document.body.style.overflow = "hidden";
      } catch (error) {
        console.error("Error initializing camera:", error);
      }
    };

    initCamera();

    // שחרור משאבים כשהקומפוננטה נעלמת
    return () => {
      releaseCamera();
      document.body.style.overflow = "";
    };
  }, []);

  // פונקציה לשחרור משאבי המצלמה
  const releaseCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    try {
      // שחרור משאבים קודמים אם קיימים
      releaseCamera();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // מצלמה אחורית
          width: { ideal: 4096 },
          height: { ideal: 2160 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);

        // הגדרת אירוע כשהוידאו מוכן
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);

          // חישוב מימדי המצלמה
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight;

          // הגדרת אזור חיתוך בגודל 80% משטח המסך
          const cropWidth = screenWidth * 0.8;
          const cropHeight = screenHeight * 0.8;

          // מיקום במרכז המסך
          setCropArea({
            x: (screenWidth - cropWidth) / 2,
            y: (screenHeight - cropHeight) / 4, // קצת יותר למעלה מהמרכז האנכי
            width: cropWidth,
            height: cropHeight,
          });
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("לא ניתן לגשת למצלמה. אנא ודא כי הינך מאשר גישה למצלמה.");
    }
  };

  // צילום תמונה
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      alert("המצלמה עדיין לא מוכנה, אנא המתן רגע");
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // התאמת גודל הקנבס לגודל הוידאו המקורי
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");

      // צייר את התמונה המלאה
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // חישוב יחס הגדלים בין הוידאו המקורי והוידאו המוצג
      const videoEl = video.getBoundingClientRect();
      const scaleX = canvas.width / videoEl.width;
      const scaleY = canvas.height / videoEl.height;

      // התאמת מיקום וגודל המסגרת לקואורדינטות של התמונה המקורית
      const scaledCropX = (cropArea.x - videoEl.left) * scaleX;
      const scaledCropY = (cropArea.y - videoEl.top) * scaleY;
      const scaledCropWidth = cropArea.width * scaleX;
      const scaledCropHeight = cropArea.height * scaleY;

      // אבטחה שלא נחרוג מגבולות התמונה
      const x = Math.max(0, scaledCropX);
      const y = Math.max(0, scaledCropY);
      const width = Math.min(scaledCropWidth, canvas.width - x);
      const height = Math.min(scaledCropHeight, canvas.height - y);

      if (width <= 0 || height <= 0) {
        throw new Error("Invalid crop area dimensions");
      }

      // חיתוך האזור המסומן
      const imageData = ctx.getImageData(x, y, width, height);

      // יצירת קנבס חדש בגודל האזור החתוך
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = width;
      croppedCanvas.height = height;
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
    } catch (e) {
      console.error("Error capturing image:", e);
      alert("אירעה שגיאה בצילום התמונה. נסה שוב.");
    }
  };

  // אישור התמונה
  const confirmImage = () => {
    if (currentImage) {
      if (isMultipleMode) {
        // במצב מרובה, שמור את כל התמונות
        mergeImages(capturedImages)
          .then((mergedImage) => {
            // שחרור משאבי המצלמה לפני החזרה
            releaseCamera();
            onCapture(dataURLtoFile(mergedImage, "document.jpg"));
            onClose();
          })
          .catch((e) => {
            console.error("Error merging images:", e);
            alert("אירעה שגיאה במיזוג התמונות. נסה שוב.");
          });
      } else {
        // במצב יחיד, שמור את התמונה הנוכחית
        // שחרור משאבי המצלמה לפני החזרה
        releaseCamera();
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
      mergeImages(capturedImages)
        .then((mergedImage) => {
          setCurrentImage(mergedImage);
          setShowPreview(true);
        })
        .catch((e) => {
          console.error("Error merging images:", e);
          alert("אירעה שגיאה במיזוג התמונות. נסה שוב.");
        });
    } else {
      alert("לא צולמו תמונות עדיין");
    }
  };

  // טיפול בסגירה ושחרור משאבים
  const handleClose = () => {
    releaseCamera();
    onClose();
  };

  // מיקום המסגרת הירוקה של שטח הצילום
  const handleCropAreaDrag = (e) => {
    if (!cropAreaRef.current) return;

    // וידוא שהמסגרת נשארת בתוך המסך
    const maxX = window.innerWidth - cropArea.width;
    const maxY = window.innerHeight - cropArea.height;

    // עדכון מיקום המסגרת עם הגבלה לגבולות המסך
    setCropArea((prevCrop) => ({
      ...prevCrop,
      x: Math.max(0, Math.min(maxX, e.clientX - prevCrop.width / 2)),
      y: Math.max(0, Math.min(maxY, e.clientY - prevCrop.height / 2)),
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
              boxShadow: "0 0 0 2000px rgba(0, 0, 0, 0.5)",
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

            <button
              className="capture-button"
              onClick={captureImage}
              disabled={!cameraReady}
            >
              {cameraReady ? "צלם" : "טוען..."}
            </button>

            {isMultipleMode && capturedImages.length > 0 && (
              <div className="multiple-capture-info">
                {capturedImages.length} תמונות צולמו
                <button onClick={finishMultipleCapture}>סיים ומזג</button>
              </div>
            )}

            <button className="close-button" onClick={handleClose}>
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
            <button onClick={handleClose}>בטל</button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default DocumentCamera;
