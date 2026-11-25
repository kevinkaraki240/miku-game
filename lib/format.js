export const formatVnd = (n) => `${Number(n).toLocaleString('vi-VN')}đ`;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';