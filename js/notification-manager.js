class NotificationManager {
  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    
    const colors = {
      success: { bg: 'linear-gradient(135deg, #28a745, #20c997)', border: '#28a745' },
      warning: { bg: 'linear-gradient(135deg, #ffc107, #fd7e14)', border: '#ffc107' },
      error: { bg: 'linear-gradient(135deg, #dc3545, #e74c3c)', border: '#dc3545' },
      info: { bg: 'linear-gradient(135deg, #007bff, #0056b3)', border: '#007bff' }
    };
    
    const color = colors[type] || colors.info;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color.bg};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      border-left: 4px solid ${color.border};
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
      white-space: pre-line;
      animation: slideInRight 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    if (duration > 0) {
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, duration);
    }
    
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
  }
}