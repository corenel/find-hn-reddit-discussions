// Create simple SVG icons
const canvas16 = document.createElement('canvas');
canvas16.width = 16;
canvas16.height = 16;
const ctx16 = canvas16.getContext('2d');

// Draw HN background color
ctx16.fillStyle = '#ff6600';
ctx16.fillRect(0, 0, 16, 16);

// Draw letter
ctx16.fillStyle = 'white';
ctx16.font = 'bold 10px Arial';
ctx16.textAlign = 'center';
ctx16.textBaseline = 'middle';
ctx16.fillText('HN', 8, 8);

// Export as PNG
const dataURL16 = canvas16.toDataURL('image/png');
console.log('16x16 icon created');

// Create 48x48 icon
const canvas48 = document.createElement('canvas');
canvas48.width = 48;
canvas48.height = 48;
const ctx48 = canvas48.getContext('2d');

// Draw HN background color
ctx48.fillStyle = '#ff6600';
ctx48.fillRect(0, 0, 48, 48);

// Draw letter
ctx48.fillStyle = 'white';
ctx48.font = 'bold 24px Arial';
ctx48.textAlign = 'center';
ctx48.textBaseline = 'middle';
ctx48.fillText('HN', 24, 20);

// Draw Reddit logo
ctx48.fillStyle = '#FF4500';
ctx48.beginPath();
ctx48.arc(24, 36, 8, 0, Math.PI * 2);
ctx48.fill();

// Export as PNG
const dataURL48 = canvas48.toDataURL('image/png');
console.log('48x48 icon created');

// Create 128x128 icon
const canvas128 = document.createElement('canvas');
canvas128.width = 128;
canvas128.height = 128;
const ctx128 = canvas128.getContext('2d');

// Draw gradient background
const gradient = ctx128.createLinearGradient(0, 0, 128, 128);
gradient.addColorStop(0, '#ff6600');
gradient.addColorStop(1, '#FF4500');
ctx128.fillStyle = gradient;
ctx128.fillRect(0, 0, 128, 128);

// Draw HN
ctx128.fillStyle = 'white';
ctx128.font = 'bold 48px Arial';
ctx128.textAlign = 'center';
ctx128.textBaseline = 'middle';
ctx128.fillText('HN', 64, 48);

// Draw Reddit
ctx128.fillStyle = 'white';
ctx128.font = 'bold 32px Arial';
ctx128.fillText('R', 64, 88);

// Export as PNG
const dataURL128 = canvas128.toDataURL('image/png');
console.log('128x128 icon created');
