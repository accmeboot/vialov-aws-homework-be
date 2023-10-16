export const validateRequiredFields = (body: Record<string, string>, requiredFields: string[]) => {
  const keys = Object.keys(body);

  return requiredFields.reduce<string[]>((acc, field) => {
    if (keys.includes(field)) {
      return acc;
    }

    return [...acc, field]
  }, [])
}
