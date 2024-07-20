const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
  storeName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  bookingDateTime: {
    type: String, // ISO 8601 string format
    required: true,
    default: () => new Date().toISOString(),
  },
  orderId: {
    type: String,
    required: true,
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ["Awaiting Confirmation", "Ready for Pickup", "Collected"],
  },
  amount: {
    type: Number,
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ["Pending", "Completed", "Failed"],
  },
  products: [
    {
      productId: {
        type: String,
        required: true,
      },
      size: {
        type: String,
      },
      color: {
        type: String,
      },
      price : {
        type : Number,
        requried : true
      },
      name: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
});

const BookingsData = mongoose.model("Booking", bookingSchema);

module.exports = BookingsData;
