interface Global extends NodeJS.Global {
  srvSymbols: Partial<{
    route: symbol
  }>
}

function get(name: keyof Global["srvSymbols"]): symbol | undefined {
  const { srvSymbols } = global as Global
  return srvSymbols && srvSymbols[name] ? srvSymbols[name] : undefined
}

function set(name: keyof Global["srvSymbols"], symbol: symbol): symbol {
  const srvSymbols = (global as Global).srvSymbols = (global as Global).srvSymbols || {}
  srvSymbols[name] = symbol
  return symbol
}

/*
 * Why don't we just `export const $route = Symbol("route")`?
 *
 * Because then the symbol would be coupled to the instance of this package
 * installed to node_modules/. Now if there was more than one instance of
 * this package installed, a type check in the one installation of this
 * package would not match instances created by the other installation.
 */

export const $route: unique symbol = get("route") || set("route", Symbol("route")) as any
