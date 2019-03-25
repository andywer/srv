export function deriveImmutable<
  Base extends {},
  Props extends { [key: string]: any }
>(base: Base, props: Props): Base & Props {
  const propDescriptors: PropertyDescriptorMap = {}

  // Using for..in here, since it's faster than Object.keys()
  for (const key in props) {
    propDescriptors[key] = {
      enumerable: true,
      value: props[key],
      writable: false
    } as PropertyDescriptor
  }
  return Object.create(base, propDescriptors)
}
