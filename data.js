export const getData = async () => {
  const data = Array.from({ length: 335 }, (_, idx) => idx + 1)
  return data
}