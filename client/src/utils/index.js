export const daysLeft = (batasWaktu) => {
  if (!batasWaktu) return 'Not Active'; // Jika batasWaktu tidak valid, kembalikan 'Not Active'

  const difference = new Date(batasWaktu).getTime() - new Date().getTime();
  const remainingDays = difference / (1000 * 3600 * 24);

  return Math.ceil(remainingDays);
};

export const calculateBarPercentage = (goal, raisedAmount) => {
  const percentage = Math.round((raisedAmount * 100) / goal);

  return percentage;
};

export const checkIfImage = (url, callback) => {
  const img = new Image();
  img.src = url;

  if (img.complete) callback(true);

  img.onload = () => callback(true);
  img.onerror = () => callback(false);
};
