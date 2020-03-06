class MerchantProcessor {
  
  constructor(checkoutClosure, creditCards) {
    this.checkoutClosure = checkoutClosure;
    this.creditCards = creditCards;
  }

  _expirationDateIsPast(month, year) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    if (year < currentYear || (year == currentYear && month < currentMonth)) {
      return true;
    }
    return false;
  }

  validateCard({ creditCardOwner, creditCardNumber, creditCardExpiration }) {
    if (!creditCardNumber) {
      throw new Error("Invalid credit card number");
    }
    if (!creditCardOwner || creditCardOwner.length > 30) {
      throw new Error("Invalid credit card owner");
    }
    const month = (creditCardExpiration || "").slice(0, 2);
    const year = (creditCardExpiration || "").slice(2, 6);
    if (!month || !year || month.length < 2 || year.length < 4) {
      throw new Error("Invalid expiration date");
    }
    if (this._expirationDateIsPast(month, year)) {
      throw new Error("Expired card");
    }
    return true;
  }

  hasFunds(creditCard, amount) {
    return this.creditCards.find(cc => cc.creditCardNumber == creditCard.creditCardNumber).amount >= amount
  }

  debit(amount, creditCard) {
    return this.checkoutClosure(amount, creditCard)
  }
}

module.exports = MerchantProcessor;