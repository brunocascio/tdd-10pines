const assert = require("assert");
const { expect } = require("chai");
const Cart = require("./Cart");
const Cashier = require("./Cashier");
const MerchantProcessorStub = require("./MerchantProcessorStub");
const App = require("./App");

getCatalog = () => ["12345", "123456", "123"];

getPriceCatalog = () => ({ "12345": 10.5, "123456": 20.3, "123": 32.56 });

newCart = () => new Cart({ catalog: getCatalog() });

getUsers = () => [
  {
    clientId: "pepe",
    password: "pepepass"
  }
];

getCarts = () => ["123456"].map(id => new Cart({ id, catalog: getCatalog() }))

newApp = () => new App({ users: getUsers(), carts: getCarts(), catalog: getCatalog() });

newMerchantService = () =>
  new MerchantProcessorStub((amount, creditCard) => {
    if (creditCard.amount < amount) {
      throw new Error("1|Insufficient funds");
    } else {
      return `0|${Date.now()}`;
    }
  });

newMerchantServiceDown = () =>
  new MerchantProcessorStub((amount, creditCard) => {
    throw new Error("Service is down");
  });

newValidCreditCard = {
  creditCardNumber: "1234-4567-8901-1234",
  creditCardExpiration: "092023",
  creditCardOwner: "Pepe Perez",
  amount: 1000000
};

newValidCreditCardWithoutAmount = {
  ...newValidCreditCard,
  amount: 0
};

invalidCreditCard = {
  ...newValidCreditCard,
  creditCardOwner:
    "Pepe PerezPepe PerezPepe PerezPepe PerezPepe PerezPepe PerezPepe Perez"
};

expiredCreditCard = {
  ...newValidCreditCard,
  creditCardExpiration: "012020"
};

newCashier = (cart, creditCard, merchantService) => {
  return new Cashier(
    cart,
    getPriceCatalog(),
    merchantService || newMerchantService(),
    creditCard
  );
};

addItem = (cart, item) => cart.addItem(item);

validBook = index => getCatalog()[index];

invalidBook = () => "9sdus9ad8a";

describe("Purchase & Checkout Tests", () => {

  describe("Test Cart", () => {
    it("Cart is created succesfully", () => {
      assert.ok(newCart());
    });
    it("Cart is empty", () => {
      assert.equal(newCart().isEmpty(), true);
    });
  });

  describe("Test add book to cart", () => {
    it("Add valid book to cart", () => {
      const cart = newCart();
      addItem(cart, validBook(0));

      assert.equal(cart.isEmpty(), false);
      assert.equal(cart.hasItem(validBook(0)), true);
      assert.equal(cart.itemsCount(), 1);
    });
    it("Add the same valid book to Cart", () => {
      const cart = newCart();
      addItem(cart, validBook(0));
      addItem(cart, validBook(0));

      assert.equal(cart.itemsCount(), 2);
      assert.equal(cart.getQuantityByItemId(validBook(0)), 2);
    });
    it("Add different valid books to Cart", () => {
      const cart = newCart();
      addItem(cart, validBook(0));
      addItem(cart, validBook(1));

      assert.equal(cart.itemsCount(), 2);
      assert.equal(cart.hasItem(validBook(0)), true);
      assert.equal(cart.hasItem(validBook(1)), true);
    });
    it("Don't add invalid book to Cart", () => {
      const cart = newCart();
      expect(() => addItem(cart, invalidBook())).to.throw(
        Error,
        /invalid item/i
      );
      assert.equal(cart.itemsCount(), 0);
    });
  });

  describe("Test checkout", () => {
    it("Cart should not be empty", () => {
      expect(() => newCashier(newCart(), newValidCreditCard)).to.throw(
        Error,
        /the cart is empty/i
      );
    });
    it("Cart amount should be sum of books", () => {
      const cart = newCart();
      const prices = getPriceCatalog();
      const validBook1 = validBook(0);
      const validBook2 = validBook(1);
      addItem(cart, validBook1);
      addItem(cart, validBook2);
      const cashier = newCashier(cart, newValidCreditCard);
      assert.equal(cashier.getTotal(), prices[validBook1] + prices[validBook2]);
    });
    it("Card should be verified succesfully", () => {
      const cart = newCart();
      const validBook1 = validBook(0);
      addItem(cart, validBook1);
      expect(() => newCashier(cart, newValidCreditCard)).to.not.throws();
    });
    it("Card should not be verified succesfully", () => {
      const cart = newCart();
      addItem(cart, validBook(0));
      expect(() => newCashier(cart, invalidCreditCard)).to.throw(
        Error,
        /invalid credit card owner/i
      );
    });
    it("Card should not be verified succesfully since it is expired", () => {
      const cart = newCart();
      addItem(cart, validBook(0));
      expect(() => newCashier(cart, expiredCreditCard)).to.throw(
        Error,
        /expired card/i
      );
    });
    it("Checkout process should fails because Cashier is down", () => {
      const cart = newCart();
      addItem(cart, validBook(0));
      const cashier = newCashier(
        cart,
        newValidCreditCard,
        newMerchantServiceDown()
      );
      expect(() => cashier.checkout()).to.throw(Error, /service is down/i);
    });
    it("Checkout process should fails because since card has not funds", () => {
      const cart = newCart();
      addItem(cart, validBook(0));
      const cashier = newCashier(
        cart,
        newValidCreditCardWithoutAmount,
        newMerchantService()
      );
      expect(() => cashier.checkout()).to.throw(
        Error,
        /1\|insufficient funds/i
      );
    });
    it("Checkout process should be ok", () => {
      const cart = newCart();
      addItem(cart, validBook(0));
      const cashier = newCashier(
        cart,
        newValidCreditCard,
        newMerchantService()
      );
      assert.ok(cashier.checkout().startsWith("0|"));
    });
  });
});

describe("TusLibros.com Tests", () => {

  it("listCart with valid clientId should return the cart items", () => {
    const cart = newApp().listCart("123456")

    assert.ok(cart.startsWith("0|"));
  })

  it("listCart with invalid clientId should fail", () => {
    expect(() => newApp().listCart("wrong")).to.throw(Error, 'not found');
  })

  it("createCart with valid credentials", () => {
    const app = newApp()
    const [,cartId] = app.createCart({
      clientId: "pepe",
      password: "pepepass"
    }).split('0|')
    const existentCart = app.listCart(cartId);
    const cart = app.getCart(cartId);
    
    assert.ok(existentCart.startsWith('0|'));
    assert.equal(cart.isEmpty(), true);
  });

  it("createCart with invalid clientId", () => {
    expect(() =>
      newApp().createCart({
        clientId: "wrong",
        password: "wrong"
      })
    ).to.throw(Error, /1|invalid credentials/i);
  });

  it("createCart with invalid pass", () => {
    expect(() => newApp().createCart({
      clientId: "pepe",
      password: "wrong"
    }), /1|invalid credentials/i);
  });

  it("addToCart with valid data", () => {
    const app = newApp()
    
    const [,cartId] = app.createCart({
      clientId: "pepe",
      password: "pepepass"
    }).split('0|');

    app.addToCart({ cartId, bookISBN: "123456", bookQuantity: 2 })
    app.addToCart({ cartId, bookISBN: "123", bookQuantity: 1 })

    assert.equal(app.listCart(cartId), "0|123|1|123456|2");
  });

  it("addToCart with invalid cartId", () => {
    const app = newApp()

    expect(() => app.addToCart({ cartId: "wrong", bookISBN: "123456", bookQuantity: 2 })).to.throw(Error, /not found/i)
  });

  it("addToCart with invalid book", () => {
    const app = newApp()
    
    const [,cartId] = app.createCart({
      clientId: "pepe",
      password: "pepepass"
    }).split('0|');

    expect(() => app.addToCart({ cartId: cartId, bookISBN: "wrong", bookQuantity: 2 })).to.throw(Error, /Invalid item/i)
  });

});
