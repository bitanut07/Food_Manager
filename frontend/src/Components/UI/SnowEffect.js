import React, { useEffect } from "react";
import "./SnowEffect.css";

const SnowEffect = () => {
    useEffect(() => {
        const createSnowflake = () => {
          const snowflake = document.createElement("div");
          snowflake.className = "snowflake";
          snowflake.textContent = "❄";
          snowflake.style.left = `${Math.random() * 100}vw`; // Vị trí ngẫu nhiên
          snowflake.style.animationDuration = `${Math.random() * 3 + 2}s, ${
            Math.random() * 3 + 2
          }s`; // Tốc độ rơi và đung đưa
          snowflake.style.opacity = `${Math.random() + 0.3}`; // Độ trong suốt ngẫu nhiên
          snowflake.style.fontSize = `${Math.random() * 5 + 5}px`; // Kích thước ngẫu nhiên
          document.body.appendChild(snowflake);
      
          // Xóa bông tuyết sau khi hoàn thành animation
          setTimeout(() => {
            snowflake.remove();
          }, 5000);
        };
      
        // Tạo bông tuyết ban đầu và liên tục
        for (let i = 0; i < 50; i++) {
          createSnowflake();
        }
        const interval = setInterval(createSnowflake, 100);
        return () => clearInterval(interval);
    }, []);
      

  return null; // Không cần giao diện
};

export default SnowEffect;
