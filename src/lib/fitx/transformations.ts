/**
 * Client before/after images (Fitx Pics, processed into
 * public/images/fitx/transformations: screenshots cropped to the card,
 * duplicates removed). `featured` are the "Client of the Month" posters,
 * whose names and results are printed on the posters themselves.
 */

export type Transformation = { src: string; width: number; height: number };

export const featuredTransformations: (Transformation & { name: string; result: string })[] = [
  { src: "/images/fitx/transformations/transformation-42.webp", width: 848, height: 1200, name: "Haseeb Tahir", result: "11 kg lost" },
  { src: "/images/fitx/transformations/transformation-43.webp", width: 842, height: 1200, name: "Asad Khan", result: "99 kg → 86 kg" },
  { src: "/images/fitx/transformations/transformation-44.webp", width: 848, height: 1200, name: "Faiza Zesshan", result: "75 kg → 59.5 kg" },
];

export const transformations: Transformation[] = [
  { src: "/images/fitx/transformations/transformation-01.webp", width: 490, height: 565 },
  { src: "/images/fitx/transformations/transformation-02.webp", width: 699, height: 752 },
  { src: "/images/fitx/transformations/transformation-03.webp", width: 699, height: 751 },
  { src: "/images/fitx/transformations/transformation-04.webp", width: 699, height: 753 },
  { src: "/images/fitx/transformations/transformation-05.webp", width: 504, height: 543 },
  { src: "/images/fitx/transformations/transformation-06.webp", width: 639, height: 783 },
  { src: "/images/fitx/transformations/transformation-07.webp", width: 679, height: 783 },
  { src: "/images/fitx/transformations/transformation-08.webp", width: 530, height: 542 },
  { src: "/images/fitx/transformations/transformation-09.webp", width: 736, height: 752 },
  { src: "/images/fitx/transformations/transformation-10.webp", width: 504, height: 543 },
  { src: "/images/fitx/transformations/transformation-11.webp", width: 699, height: 752 },
  { src: "/images/fitx/transformations/transformation-12.webp", width: 699, height: 752 },
  { src: "/images/fitx/transformations/transformation-13.webp", width: 890, height: 1044 },
  { src: "/images/fitx/transformations/transformation-14.webp", width: 489, height: 565 },
  { src: "/images/fitx/transformations/transformation-15.webp", width: 678, height: 800 },
  { src: "/images/fitx/transformations/transformation-16.webp", width: 890, height: 1123 },
  { src: "/images/fitx/transformations/transformation-17.webp", width: 504, height: 543 },
  { src: "/images/fitx/transformations/transformation-18.webp", width: 762, height: 1015 },
  { src: "/images/fitx/transformations/transformation-19.webp", width: 900, height: 1062 },
  { src: "/images/fitx/transformations/transformation-20.webp", width: 639, height: 783 },
  { src: "/images/fitx/transformations/transformation-21.webp", width: 699, height: 751 },
  { src: "/images/fitx/transformations/transformation-22.webp", width: 639, height: 783 },
  { src: "/images/fitx/transformations/transformation-23.webp", width: 462, height: 565 },
  { src: "/images/fitx/transformations/transformation-24.webp", width: 462, height: 565 },
  { src: "/images/fitx/transformations/transformation-25.webp", width: 762, height: 1016 },
  { src: "/images/fitx/transformations/transformation-26.webp", width: 462, height: 565 },
  { src: "/images/fitx/transformations/transformation-27.webp", width: 462, height: 565 },
  { src: "/images/fitx/transformations/transformation-28.webp", width: 639, height: 783 },
  { src: "/images/fitx/transformations/transformation-30.webp", width: 462, height: 565 },
  { src: "/images/fitx/transformations/transformation-31.webp", width: 462, height: 565 },
  { src: "/images/fitx/transformations/transformation-32.webp", width: 490, height: 565 },
  { src: "/images/fitx/transformations/transformation-33.webp", width: 678, height: 800 },
  { src: "/images/fitx/transformations/transformation-34.webp", width: 642, height: 788 },
  { src: "/images/fitx/transformations/transformation-35.webp", width: 639, height: 783 },
  { src: "/images/fitx/transformations/transformation-36.webp", width: 530, height: 542 },
  { src: "/images/fitx/transformations/transformation-37.webp", width: 462, height: 565 },
  { src: "/images/fitx/transformations/transformation-38.webp", width: 504, height: 543 },
  { src: "/images/fitx/transformations/transformation-39.webp", width: 825, height: 976 },
  { src: "/images/fitx/transformations/transformation-40.webp", width: 825, height: 976 },
  { src: "/images/fitx/transformations/transformation-41.webp", width: 701, height: 1014 },
];
