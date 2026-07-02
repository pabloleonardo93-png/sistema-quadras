export const courtImages = {
  areia1: "/images/quadras/areia-01.jpeg",
  areia2: "/images/quadras/areia-02.jpeg",
  areia3: "/images/quadras/areia-03.webp",
  onda1: "/images/quadras/areia-01.jpeg",
  onda2: "/images/quadras/areia-02.jpeg",
  onda3: "/images/quadras/areia-03.webp",
};

export const courtImagesByName = {
  "Areia 01": courtImages.areia1,
  "Areia 02": courtImages.areia2,
  "Areia 03": courtImages.areia3,
  "Onda 01": courtImages.areia1,
  "Onda 02": courtImages.areia2,
  "Onda 03": courtImages.areia3,
};

export function getCourtImage(quadra, index = 0) {
  const fallbacks = [courtImages.areia1, courtImages.areia2, courtImages.areia3];

  return (
    courtImagesByName[quadra?.nome] ||
    quadra?.imagemUrl ||
    fallbacks[index % fallbacks.length]
  );
}
