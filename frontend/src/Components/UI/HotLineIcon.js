import React from "react";
import "./HotlineIcon.css"; // Import CSS riêng cho component

function HotlineIcon() {
  const messengerLink = "https://m.me/555556954303917"; // Thay <YOUR_PAGE_ID> bằng ID trang Facebook của bạn

  return (
    <div className="hotline-icon">
      <a href={messengerLink} target="_blank" rel="noopener noreferrer">
        <div className="icon-wrapper">
          <i className="fa fa-comments"></i> {/* Font Awesome icon */}
          <span className="notification-badge">1</span>
        </div>
      </a>
    </div>
  );
}

export default HotlineIcon;
