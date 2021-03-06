class Cart {
  constructor(args = {}) {
    const { catalog = [], id, items = [] } = args;
    this.id = id || Date.now();
    this.items = items;
    this.catalog = catalog;
  }

  /*
   *
   * @returns "ISBN_1|QT_1|ISBN_2|QT_2"
   */
  itemsToString() {
    return Object.entries(
      this.items.reduce(
        (obj, itemId) => ({
          ...obj,
          [itemId]: (obj[itemId] || 0) + 1
        }),
        {}
      )
    )
      .map(([isbn, qt]) => `${isbn}|${qt}`)
      .join("|");
  }

  addItem(itemId) {
    if (!this.isValidItem(itemId)) {
      throw new Error("Invalid Item");
    }
    this.items.push(itemId);
    return itemId;
  }

  getId() {
    return this.id;
  }

  getItems() {
    return this.items;
  }

  itemsCount() {
    return this.getItems().length;
  }

  isEmpty() {
    return !this.getItems().length;
  }

  hasItem(itemId) {
    return Boolean(this.getItems().find(i => i === itemId));
  }

  isValidItem(itemId) {
    return Boolean(this.catalog.find(i => i === itemId));
  }

  getQuantityByItemId(itemId) {
    return this.getItems().filter(id => id === itemId).length;
  }
}

module.exports = Cart;
