const Cart = require("./Cart");
const Cashier = require("./Cashier");

class App {
  constructor({ users = [], carts = {}, catalog = [], pricesCatalog = [], merchantService }) {
    this.users = users;
    this.carts = carts;
    this.catalog = catalog;
    this.pricesCatalog = pricesCatalog;
    this.merchantService = merchantService;
    this.carts.forEach(c => this._updateCartExpiration(c.getId()));
  }

  _updateCartExpiration(cartId, expiresAt) {
    this.cartsExpirations = {
      ...this.cartsExpirations,
      // 30 minutes
      [cartId]: expiresAt || Date.now() + 30 * 60 * 1000
    };
  }

  _assertExpiredCart(cartId) {
    if (this.cartsExpirations[cartId] < Date.now()) {
      throw new Error("Expired Cart");
    }
  }

  validateUser({ clientId, password }) {
    return this.users.find(
      u => u.clientId == clientId && u.password == password
    );
  }

  createCart(credentials, { expiresAt } = {}) {
    if (!this.validateUser(credentials)) {
      throw new Error("1|Invalid Credentials");
    }
    const cart = new Cart({ catalog: this.catalog });
    this.carts.push(cart);
    this._updateCartExpiration(cart.getId(), expiresAt);
    return `0|${cart.getId()}`;
  }

  getCart(cartId) {
    const cart = this.carts.find(c => c.getId() == cartId);
    if (!cart) {
      throw new Error(`1|Cart not found (${cartId})`);
    }
    this._assertExpiredCart(cart.getId());
    this._updateCartExpiration(cart.getId());
    return cart;
  }

  listCart(cartId) {
    const cart = this.getCart(cartId);
    return `0|${cart.itemsToString()}`;
  }

  addToCart({ cartId, bookISBN, bookQuantity }) {
    const cart = this.getCart(cartId);
    for (let i = 0; i < bookQuantity; i++) {
      cart.addItem(bookISBN);
    }
    return "0|OK";
  }

  checkout({ cartId, ccn, cced, cco }) {
    const cart = this.getCart(cartId);
    const creditCard = {
        creditCardNumber: ccn,
        creditCardExpiration: cced,
        creditCardOwner: cco
    }
    const cashier = new Cashier(
      cart,
      this.pricesCatalog,
      this.merchantService,
      creditCard
    );

    return cashier.checkout();
  }
}

module.exports = App;
