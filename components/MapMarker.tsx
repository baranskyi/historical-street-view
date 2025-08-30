import React, { useRef, useEffect, useState } from 'react';
import { Point } from '../types';
import UndoIcon from './icons/UndoIcon';

interface MapMarkerProps {
  mapImageUrl: string;
  onGenerate: (mergedImageBase64: string) => void;
  disabled?: boolean;
  error?: string | null;
  onUploadNew: () => void;
}

const drawArrow = (context: CanvasRenderingContext2D, from: Point, to: Point) => {
  const headlen = 25; // Increased for better proportion
  const tailExtension = 50; // Fixed length to extend the tail backwards
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return; // cannot draw an arrow of zero length

  // Normalized direction vector
  const ux = dx / length;
  const uy = dy / length;
  
  // Calculate the new start point for the tail
  const tailX = from.x - ux * tailExtension;
  const tailY = from.y - uy * tailExtension;

  context.strokeStyle = '#FF007A';
  context.lineWidth = 6; // Increased for better visibility
  context.lineCap = 'round';
  context.shadowColor = 'rgba(0, 0, 0, 0.7)';
  context.shadowBlur = 10;
  
  // Line from extended tail to tip
  context.beginPath();
  context.moveTo(tailX, tailY);
  context.lineTo(to.x, to.y);
  context.stroke();

  // Arrowhead
  context.beginPath();
  context.moveTo(to.x, to.y);
  context.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
  context.moveTo(to.x, to.y);
  context.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
  context.stroke();
  
  // Reset shadow
  context.shadowColor = 'transparent';
  context.shadowBlur = 0;
};


const MapMarker: React.FC<MapMarkerProps> = ({ mapImageUrl, onGenerate, disabled = false, error, onUploadNew }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const image = new Image();
    image.src = mapImageUrl;
    image.onload = () => {
      imageRef.current = image;
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    };
  }, [mapImageUrl]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const image = imageRef.current;
    if (!canvas || !context || !image || imageSize.width === 0) return;

    // Set canvas buffer size to the image's actual size
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    if (points.length === 2) {
      drawArrow(context, points[0], points[1]);
    } else if (points.length === 1) {
      context.beginPath();
      context.arc(points[0].x, points[0].y, 10, 0, 2 * Math.PI);
      context.fillStyle = '#FF007A';
      context.fill();
    }
  }, [points, imageSize]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (points.length >= 2 || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    setPoints(prevPoints => [...prevPoints, { x, y }]);
  };

  const handleUndo = () => {
    setPoints(prevPoints => prevPoints.slice(0, -1));
  };
  
  const handleGenerateClick = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context || !image || points.length !== 2) return;
    
    // Perform a final, clean draw on the canvas before exporting the image
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context.drawImage(image, 0, 0);
    drawArrow(context, points[0], points[1]);

    const mergedImage = canvas.toDataURL('image/jpeg', 0.9);
    onGenerate(mergedImage);
  };
  
  const instruction = points.length === 0 
    ? "Tap on the map to set your starting point."
    : points.length === 1
    ? "Tap again to set the direction you are looking."
    : "Ready to generate your view!";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-2 rounded-lg mb-4 text-center text-cyan-300">
        <p>{instruction}</p>
        {error && <p className="text-red-400 mt-2 font-semibold">{error}</p>}
      </div>
      <div 
        className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl shadow-purple-500/20"
        style={{ aspectRatio: imageSize.width > 0 ? `${imageSize.width} / ${imageSize.height}` : '16 / 9' }}
      >
        <canvas 
          ref={canvasRef} 
          onClick={handleCanvasClick} 
          className={`w-full h-full ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
        />
      </div>
      <div className="flex items-center space-x-4 mt-6">
        <button onClick={onUploadNew} className="px-5 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Upload New Map
        </button>
        <button onClick={handleUndo} disabled={points.length === 0 || disabled} className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <UndoIcon />
        </button>
        <button onClick={handleGenerateClick} disabled={points.length !== 2 || disabled} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          Generate
        </button>
      </div>
    </div>
  );
};

export default MapMarker;