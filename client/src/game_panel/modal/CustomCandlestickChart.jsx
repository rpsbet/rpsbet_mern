import React, { useRef, useEffect } from "react";

function CustomCandlestickChart({ candles, isDarkMode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (candles && candles.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Determine chart bounds
      const maxPrice = Math.max(...candles.map((c) => c.high));
      const minPrice = Math.min(...candles.map((c) => c.low));
      const priceRange = maxPrice - minPrice;

      const margin = 10;
      const chartWidth = width - 2 * margin;
      const chartHeight = height - 2 * margin;

      const candleWidth = chartWidth / candles.length;

      // Draw axes
      ctx.strokeStyle = isDarkMode ? "#fff" : "#000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, margin);
      ctx.lineTo(margin, height - margin);
      ctx.lineTo(width - margin, height - margin);
      ctx.stroke();

      // Draw candles
      candles.forEach((candle, index) => {
        const x = margin + index * candleWidth + candleWidth / 4;
        const openY =
          height - margin - ((candle.open - minPrice) / priceRange) * chartHeight;
        const closeY =
          height - margin - ((candle.close - minPrice) / priceRange) * chartHeight;
        const highY =
          height - margin - ((candle.high - minPrice) / priceRange) * chartHeight;
        const lowY =
          height - margin - ((candle.low - minPrice) / priceRange) * chartHeight;

        const color = candle.close > candle.open ? "#00b140" : "#ff4b4b";

        // Draw wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 4, highY);
        ctx.lineTo(x + candleWidth / 4, lowY);
        ctx.stroke();

        // Draw body
        ctx.fillStyle = color;
        ctx.fillRect(
          x,
          Math.min(openY, closeY),
          candleWidth / 2,
          Math.abs(closeY - openY)
        );
      });
    }
  }, [candles, isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      style={{
        border: "1px solid #ccc",
        background: isDarkMode ? "#333" : "#fff",
      }}
    ></canvas>
  );
}

export default CustomCandlestickChart;