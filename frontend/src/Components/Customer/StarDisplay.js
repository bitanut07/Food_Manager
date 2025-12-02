import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const StarDisplay = ({ point }) => {
  const totalStars = 5;
  const fullStars = Math.floor(point); // Số sao đầy đủ
  const hasHalfStar = point % 1 >= 0.5; // Kiểm tra có sao nửa không
  const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0); // Số sao trống

  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      {/* Hiển thị sao đầy đủ */}
      {Array.from({ length: fullStars }, (_, i) => (
        <FaStar key={`full-${i}`} color="#FFD700" size={24} />
      ))}
      {/* Hiển thị sao nửa */}
      {hasHalfStar && <FaStarHalfAlt color="#FFD700" size={24} />}
      {/* Hiển thị sao trống */}
      {Array.from({ length: emptyStars }, (_, i) => (
        <FaRegStar key={`empty-${i}`} color="#E4E5E9" size={24} />
      ))}
    </div>
  );
};

export default StarDisplay;
