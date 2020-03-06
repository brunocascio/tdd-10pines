class Cashier {
  constructor(cart, pricesCatalog, merchantService, creditCard) {
    if (cart.itemsCount() === 0) {
      throw new Error("The Cart is empty");
    }
    this.cart = cart;
    this.pricesCatalog = pricesCatalog;
    this.merchantService = merchantService;
    this.creditCard = creditCard;
    // validate credit card
    this._verifyCreditCard();
  }

  getTotal() {
    return this.cart
      .getItems()
      .reduce((sum, item) => sum + this.pricesCatalog[item], 0);
  }

  _verifyCreditCard() {
    return this.merchantService.validateCard(this.creditCard);
  }

  checkout() {
    return this.merchantService.debit(this.getTotal(), this.creditCard)
  }
}

module.exports = Cashier