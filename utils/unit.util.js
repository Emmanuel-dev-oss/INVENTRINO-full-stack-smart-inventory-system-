export const convertToBaseUnit = (product, unitName, amount) => {
  const unit = product.units.find(u => u.name === unitName)

  if (!unit) throw new Error("Invalid unit")

  return amount * unit.conversion
}

export const formatStock = (product) => {
  let remaining = product.quantity
  let result = []

  const sorted = [...product.units].sort(
    (a, b) => b.conversion - a.conversion
  )

  for (let unit of sorted) {
    const count = Math.floor(remaining / unit.conversion)

    if (count > 0) {
      result.push(`${count} ${unit.name}`)
      remaining %= unit.conversion
    }
  }

  return result.join(" + ")
}