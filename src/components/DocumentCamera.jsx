// src/components/DocumentCamera.jsx - תיקון בעיות תצוגה ומיקום
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

    // מניעת גלילה בגוף המסמך כשהמצלמה פתוחה
    document.body.style.overflow = "hidden";

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      document.body.style.overflow = "";
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

      // מחכים שהוידאו יטען כדי להגדיר את אזור החיתוך
      videoRef.current.onloadedmetadata = () => {
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;

        // הגדרת אזור חיתוך בהתאם לגודל המסך
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // חישוב מידות אזור החיתוך להיות בתוך המסך
        const cropWidth = Math.min(videoWidth * 0.8, screenWidth * 0.8);
        const cropHeight = Math.min(videoHeight * 0.6, screenHeight * 0.5);

        setCropArea({
          x: (screenWidth - cropWidth) / 2,
          y: (screenHeight - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight,
        });
      };
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("לא ניתן לגשת למצלמה. אנא ודא כי הינך מאשר גישה למצלמה.");
    }
  };

  // צילום תמונה
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // התאמת גודל הקנבס לגודל הוידאו
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");

      // צייר את התמונה המלאה
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // מציאת יחס המידה בין הוידאו לבין מה שמוצג במסך
      const videoRatio = {
        x: video.videoWidth / video.offsetWidth,
        y: video.videoHeight / video.offsetHeight,
      };

      // חישוב מיקום וגודל אזור החיתוך בקואורדינטות של הוידאו המקורי
      const scaledCrop = {
        x: cropArea.x * videoRatio.x,
        y: cropArea.y * videoRatio.y,
        width: cropArea.width * videoRatio.x,
        height: cropArea.height * videoRatio.y,
      };

      // ודא שאזור החיתוך נמצא בגבולות התמונה
      const validCrop = {
        x: Math.max(0, Math.min(scaledCrop.x, canvas.width - 10)),
        y: Math.max(0, Math.min(scaledCrop.y, canvas.height - 10)),
        width: Math.min(scaledCrop.width, canvas.width - validCrop.x),
        height: Math.min(scaledCrop.height, canvas.height - validCrop.y),
      };

      // חיתוך האזור המסומן
      try {
        const imageData = ctx.getImageData(
          validCrop.x,
          validCrop.y,
          validCrop.width,
          validCrop.height
        );

        // יצירת קנבס חדש בגודל האזור החתוך
        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = validCrop.width;
        croppedCanvas.height = validCrop.height;
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
    }
  };

  // אישור התמונה במצב יחיד
  const confirmImage = () => {
    if (currentImage) {
      if (isMultipleMode) {
        // במצב מרובה, שמור את כל התמונות
        mergeImages(capturedImages)
          .then((mergedImage) => {
            onCapture(dataURLtoFile(mergedImage, "document.jpg"));
            onClose();
          })
          .catch((e) => {
            console.error("Error merging images:", e);
            alert("אירעה שגיאה במיזוג התמונות. נסה שוב.");
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

  // מיקום המסגרת הירוקה של שטח הצילום
  const handleCropAreaDrag = (e) => {
    if (!cropAreaRef.current) return;

    const rect = cropAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
