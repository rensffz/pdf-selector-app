import { useEffect, useRef, useState } from 'react';

const PDFPage = ({ pdf, pageNumber, onRectChange, containerWidth }) => {
  const canvasRef = useRef();
  const [isSelecting, setIsSelecting] = useState(false);
  const [localRect, setLocalRect] = useState(null); // Координаты текущей области
  const startPoint = useRef(null);

  useEffect(() => {
    if (!pdf || !containerWidth) return;

    let renderTask = null;

    const renderPage = async () => {
      const page = await pdf.getPage(pageNumber);
      const unscaledViewport = page.getViewport({ scale: 1 }); // Получаем размеры без масштаба
      const scale = containerWidth / unscaledViewport.width; // Вычисляем масштаб под ширину
      const viewport = page.getViewport({ scale }); // Получаем отмасштабированный viewport

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

export default PDFPage;
