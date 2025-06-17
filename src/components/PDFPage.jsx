import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addSelection } from '../store/pdfSlice';

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

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getMousePos(e);
    setSelection({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!selection) return;
    const { x, y } = getMousePos(e);
    setSelection((prev) => ({
      ...prev,
      width: x - prev.x,
      height: y - prev.y,
    }));
  };

  const handleMouseUp = () => {
    if (!selection || selection.width === 0 || selection.height === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const { x, y, width, height } = selection;
    const cropX = Math.min(x, x + width);
    const cropY = Math.min(y, y + height);
    const cropWidth = Math.abs(width);
    const cropHeight = Math.abs(height);

    const imageData = context.getImageData(cropX, cropY, cropWidth, cropHeight);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    tempCanvas.getContext('2d').putImageData(imageData, 0, 0);

    const base64 = tempCanvas.toDataURL();
    dispatch(addSelection(base64));
    console.log('Добавлено выделение:', base64);
    setSelection(null);
  };

  return (
    <div className="mb-6 relative" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="border shadow"
      />
      {selection && (
        <div
          className="absolute border-2 border-blue-600 bg-blue-200/30 pointer-events-none"
          style={{
            left: `${Math.min(selection.x, selection.x + selection.width)}px`,
            top: `${Math.min(selection.y, selection.y + selection.height)}px`,
            width: `${Math.abs(selection.width)}px`,
            height: `${Math.abs(selection.height)}px`,
          }}
        />
      )}
    </div>
  );
};

export default PDFPage;
