import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf";
import PDFPage from "./PDFPage";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.js",
  import.meta.url
).toString();

const Selector = () => {
  const [pdf, setPdf] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentRect, setCurrentRect] = useState(null);
  const canvasMap = useRef({});
  const [leftWidth, setLeftWidth] = useState(70); // проценты
  const leftColumnRef = useRef();
  const [containerWidth, setContainerWidth] = useState(0);

  const fileName = new URLSearchParams(window.location.search).get("fileName");

  // Загрузка PDF
  useEffect(() => {
    if (!fileName) return;
    const loadPDF = async () => {
      const loadingTask = pdfjsLib.getDocument(`/pdf-selector-app/files/${fileName}`);
      const loadedPdf = await loadingTask.promise;
      setPdf(loadedPdf);
    };
    loadPDF();
  }, [fileName]);

  // ResizeObserver для левой колонки
  useEffect(() => {
    if (!leftColumnRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(leftColumnRef.current);

    return () => resizeObserver.disconnect();
  }, [leftWidth]);

  const handleRectChange = (rect, canvas) => {
    setCurrentRect({ ...rect });
    if (canvas) {
      canvasMap.current[rect.pageNumber] = canvas;
    }
  };

  const handleApply = () => {
    if (!currentRect) return;
    const { x, y, width, height, pageNumber } = currentRect;
    const canvas = canvasMap.current[pageNumber];
    if (!canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
    const base64 = tempCanvas.toDataURL("image/png");
    setSelectedImages((prev) => [...prev, base64]);
    setCurrentRect(null);
  };

  const startResizing = (e) => {
    const startX = e.clientX;
    const initialWidth = leftWidth;
    const onMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newWidth = initialWidth + (delta / window.innerWidth) * 100;
      setLeftWidth(Math.min(90, Math.max(10, newWidth)));
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div style={{ display: "flex", height: "100vh", position: "relative" }}>
      {/* Левая колонка */}
      <div
        ref={leftColumnRef}
        style={{
          width: `${leftWidth}%`,
          overflowY: "scroll",
          borderRight: "2px solid #ccc",
          padding: 10,
          boxSizing: "border-box",
        }}
      >
        {pdf &&
          Array.from({ length: pdf.numPages }, (_, i) => (
            <PDFPage
              key={i}
              pdf={pdf}
              pageNumber={i + 1}
              onRectChange={handleRectChange}
              containerWidth={containerWidth}
            />
          ))}
      </div>

      {/* Реcайзер */}
      <div
        style={{
          width: 5,
          cursor: "col-resize",
          backgroundColor: "#eee",
        }}
        onMouseDown={startResizing}
      ></div>

      {/* Правая колонка */}
      <div
        style={{
          width: `${100 - leftWidth - 0.5}%`,
          overflowY: "auto",
          padding: 10,
          fontFamily: 'Montserrat, sans-serif',
          boxSizing: "border-box",
        }}
      >
        <h2>Выделенные фрагменты:</h2>
        {selectedImages.length === 0 && <p>Пока нет выделенных областей</p>}
        {selectedImages.map((src, i) => (
          <div key={i} style={{ position: "relative", marginBottom: 10 }}>
            <img
              src={src}
              alt={`Фрагмент ${i + 1}`}
              style={{
                width: "100%",
                border: "0.5px solid rgb(209, 213, 221)",
                borderRadius: 4,
              }}
            />
            <button
              onClick={() =>
                setSelectedImages((prev) => prev.filter((_, idx) => idx !== i))
              }
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                background: "rgba(255,0,0,0.8)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: 24,
                height: 24,
                cursor: "pointer",
                fontWeight: "bold",
                lineHeight: "20px",
              }}
              title="Удалить"
              aria-label="Удалить выделенный фрагмент"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleApply}
        disabled={!currentRect}
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 20px",
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 16,
          backgroundColor: currentRect ? "#007bff" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: currentRect ? "pointer" : "not-allowed",
          zIndex: 9999,
        }}
      >
        Применить выделение
      </button>
    </div>
  );
};

export default Selector;
