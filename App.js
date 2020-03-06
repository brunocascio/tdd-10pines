const Cart = require("./Cart");

class App {
  constructor({ users = [], carts = {}, catalog = [] }) {
    this.users = users;
    this.carts = carts;
    this.catalog = catalog
  }

  validateUser({ clientId, password }) {
    return this.users.find(
      u => u.clientId == clientId && u.password == password
    );
  }

  createCart(credentials) {
    if (!this.validateUser(credentials)) {
      throw new Error("1|Invalid Credentials");
    }
    const cart = new Cart({ catalog: this.catalog });
    this.carts.push(cart);
    return `0|${cart.getId()}`;
  }

  getCart(cartId) {
    const cart = this.carts.find(c => c.getId() == cartId);
    if (!cart) {
      throw new Error(`1|Cart not found (${cartId})`);
    }
    return cart
  }

  listCart(cartId) {
    const cart = this.getCart(cartId);
    return `0|${cart.itemsToString()}`;
  }

  addToCart({ cartId, bookISBN, bookQuantity }) {
    const cart = this.getCart(cartId)
    for(let i = 0; i < bookQuantity; i++) {
        cart.addItem(bookISBN)
    }
    return "0|OK"
  }
}

module.exports = App;
