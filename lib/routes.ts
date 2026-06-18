export const routes = {
  home: "/",
  table: (tableId: string) => `/table/${tableId}`,
  menu: (tableId: string) => `/table/${tableId}/menu`,
  cart: (tableId: string) => `/table/${tableId}/cart`,
  orders: (tableId: string) => `/table/${tableId}/orders`,
  pay: (tableId: string) => `/table/${tableId}/pay`,
};
