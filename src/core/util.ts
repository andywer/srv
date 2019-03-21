export function deriveImmutable<
  Base extends {},
  Props extends { [key: string]: any }
>(base: Base, props: Props): Base & Props {
  const propDescriptors: PropertyDescriptorMap = {}
  for (const key of Object.keys(props)) {
    propDescriptors[key] = {
      enumerable: true,
      value: props[key],
      writable: false
    } as PropertyDescriptor
  }
  return Object.create(base, propDescriptors)
}
