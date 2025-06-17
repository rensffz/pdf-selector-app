import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.js",
  import.meta.url
).toString();

const PDFPage = ({ pdf, pageNumber, onRectChange, containerWidth }) => {
  const canvasRef = useRef();
  const [isSelecting, setIsSelecting] = useState(false);
  const [localRect, setLocalRect] = useState(null);
  const startPoint = useRef(null);

  useEffect(() => {
    if (!pdf || !containerWidth) return;

    let renderTask = null;

    const renderPage = async () => {
      const page = await pdf.getPage(pageNumber);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      renderTask = page.render({ canvasContext: context, viewport });
      try {
        await renderTask.promise;
      } catch (e) {
        if (e.name !== "RenderingCancelledException") {
          console.error(e);
        }
      }
    };

    renderPage();

    return () => {
      if (renderTask?.cancel) renderTask.cancel();
    };
  }, [pdf, pageNumber, containerWidth]);

  const onMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    startPoint.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsSelecting(true);
    setLocalRect(null);
  };

  const onMouseMove = (e) => {
    if (!isSelecting) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const curr = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const x = Math.min(startPoint.current.x, curr.x);
    const y = Math.min(startPoint.current.y, curr.y);
    const width = Math.abs(startPoint.current.x - curr.x);
    const height = Math.abs(startPoint.current.y - curr.y);
    const newRect = { x, y, width, height, pageNumber };
    setLocalRect(newRect);
    onRectChange(newRect, canvasRef.current);
  };

  const onMouseUp = () => {
    setIsSelecting(false);
  };

  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{ border: "0.5px solid rgb(209, 213, 221)", cursor: "crosshair", width: "100%", height: "auto" }}
      />
      {localRect && (
        <div
          style={{
            position: "absolute",
            left: localRect.x,
            top: localRect.y,
            width: localRect.width,
            height: localRect.height,
            border: "2px dashed red",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

const Selector = () => {
  const [pdf, setPdf] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentRect, setCurrentRect] = useState(null);
  const canvasMap = useRef({});
  const [leftWidth, setLeftWidth] = useState(70); // проценты
  const leftColumnRef = useRef();
  const [containerWidth, setContainerWidth] = useState(0);

  const fileName = new URLSearchParams(window.location.search).get("fileName");

  // Загружаем PDF
  useEffect(() => {
    if (!fileName) return;
    const loadPDF = async () => {
      const loadingTask = pdfjsLib.getDocument(`/files/${fileName}`);
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

      {/* Резайзер */}
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

      {/* Фиксированная кнопка "Применить" */}
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
