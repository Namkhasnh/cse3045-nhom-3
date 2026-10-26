import type {ReactNode} from 'react'
import type {CartCatalog} from './model'
import {CartContext,useCartState} from './use-cart'
export function CartProvider({catalog,children}:{catalog:CartCatalog;children:ReactNode}){const cart=useCartState(catalog);return <CartContext.Provider value={cart}>{children}</CartContext.Provider>}
