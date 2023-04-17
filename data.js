export const getData = async () => {
  const data = Array.from({ length: 2000 }, (_, idx) => idx + 1)
  return data
}