export const isDateParam = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");

export const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isOpenDate = (value) =>
  isDateParam(value) && new Date(`${value}T12:00:00`).getDay() !== 1;

export const getNextOpenDate = () => {
  const date = new Date();

  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 1);

  return formatDateInput(date);
};
